const margin = { top: 50, right: 50, bottom: 100, left: 80 },
      width = 1600 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

const svg = d3.select("#q12-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
    .attr("class", "q12-tooltip");


d3.csv("data_ggsheet-data.csv").then(rawData => {
    rawData.forEach(d => {
        d["Thành tiền"] = +d["Thành tiền"];
    });

    const spendingByCustomer = d3.rollups(
        rawData,
        v => d3.sum(v, d => d["Thành tiền"]),
        d => d["Mã khách hàng"]
    );

    const formatNumber = d3.format(",");
    const binSize = 50000;

    const binsMap = new Map();

    spendingByCustomer.forEach(([customerId, totalSpend]) => {
        const binIndex = Math.floor(totalSpend / binSize);
        const lowerBound = binIndex * 50000;
        const upperBound = lowerBound + 50000;
        const binLabel = `${upperBound / 1000}K`;

        const lowerFormatted = formatNumber(lowerBound);
        const upperFormatted = formatNumber(upperBound);
        const tooltipLabel = `${lowerFormatted} đến ${upperFormatted}`;

        if (!binsMap.has(binLabel)) {
            binsMap.set(binLabel, { count: 0, tooltip: tooltipLabel, lower: lowerBound, upper: upperBound });
        }

        const binData = binsMap.get(binLabel);
        binData.count += 1;
    });

    const data = Array.from(binsMap, ([label, { count, tooltip, lower, upper }]) => ({
        label,
        count,
        tooltip,
        lower,
        upper
    })).sort((a, b) => a.lower - b.lower);

    console.log("Phân phối mức chi trả:", data);

    const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .nice()
        .range([height, 0]);

    svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x)
        .tickFormat((d, i) => {
            return (i % 2 === 0) ? d : "";
        })
    )
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-0.8em")
    .attr("dy", "-0.15em")
    .attr("transform", "rotate(-90)")
    .style("font-size", "12px");


    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "12px");

    svg.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#4e79a7")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            const lowerFormatted = d.lower.toLocaleString('vi-VN');
            const upperFormatted = d.upper.toLocaleString('vi-VN');
            tooltip.html(`
                <strong>Đã chỉ tiêu Từ ${lowerFormatted} đến ${upperFormatted}</strong><br/>
                Số lượng KH: ${d.count.toLocaleString('vi-VN')}
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.transition().duration(500).style("opacity", 0);
        });

}).catch(error => {
    console.error("Lỗi load dữ liệu:", error);
});