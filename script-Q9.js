const margin = { top: 40, right: 150, bottom: 60, left: 80 },
    width = 500 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

const tooltip = d3.select(".q9-tooltip");

d3.csv("data_ggsheet-data.csv").then(rawData => {
    const nestedData = d3.rollup(
        rawData,
        v => {
            const uniqueOrders = new Set(v.map(m => m["Mã đơn hàng"])).size;
            const itemCounts = d3.rollup(v,
                g => new Set(g.map(m => m["Mã đơn hàng"])).size,
                m => `[${m["Mã mặt hàng"]}] ${m["Tên mặt hàng"]}`
            );
            const items = Array.from(itemCounts).map(([key, value]) => ({
                MatHang: key,
                totalOrders: value,
                probability: value / uniqueOrders
            }));
            items.sort((a, b) => b.probability - a.probability);
            return items;
        },
        d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
    );

    let chartIndex = 1;
    nestedData.forEach((items, tenNhomHang) => {
        if (chartIndex > 5) return;

        const chartId = `chart${chartIndex}`;
        const svgContainer = d3.select(`#${chartId}`);
        svgContainer.append("div")
            .attr("class", "q9-chart-title")
            .text(tenNhomHang);

        const longestLabelLength = d3.max(items, d => d.MatHang.length);
        const adjustedLeftMargin = Math.max(120, longestLabelLength * 7);
        const adjustedWidth = width + (adjustedLeftMargin - margin.left);

        const svg = svgContainer.append("svg")
            .attr("width", adjustedWidth + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${adjustedLeftMargin},${margin.top})`);

        const color = d3.scaleOrdinal()
            .domain(items.map(d => d.MatHang))
            .range(d3.schemeTableau10);

        const y = d3.scaleBand()
            .domain(items.map(d => d.MatHang))
            .range([0, height])
            .padding(0.2);

        const x = d3.scaleLinear()
            .domain([0, d3.max(items, d => d.probability)])
            .nice()
            .range([0, width]);

        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("font-size", longestLabelLength > 20 ? "10px" : "12px")
            .style("text-anchor", "end");

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".0%")));

        svg.selectAll(".bar")
            .data(items)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.MatHang))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.probability))
            .attr("fill", d => color(d.MatHang))
            .on("mouseover", function (event, d) {
                tooltip.style("display", "block")
                    .html(`
                           Mặt hàng:                <strong>${d.MatHang}</strong><br>
                           Nhóm hàng:               ${tenNhomHang}<br>
                           SL Đơn Bán:              ${d3.format(",")(d.totalOrders)}<br>
                           Xác suất bán/Nhóm hàng:  ${d3.format(".1%")(d.probability)}`);
                d3.select(this).style("opacity", 0.7);
            })
            .on("mousemove", function (event) {
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("display", "none");
                d3.select(this).style("opacity", 1);
            });

        chartIndex++;
    });
}).catch(error => {
    console.error("Lỗi khi load file CSV:", error);
});