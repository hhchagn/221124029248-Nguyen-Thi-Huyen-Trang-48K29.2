const margin = { top: 30, right: 30, bottom: 50, left: 100 },
  width = 1400 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

const svg = d3.select("#q5-chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`); // Sửa ở đây

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "q5-tooltip")
  .style("opacity", 0);

d3.csv("data_ggsheet-data.csv").then(rawData => {

  rawData.forEach(d => {
    d["Thành tiền"] = +d["Thành tiền"];
    d["SL"] = +d["SL"];
    d["Thời gian tạo đơn"] = new Date(d["Thời gian tạo đơn"]);
    d["Ngày"] = d["Thời gian tạo đơn"].getDate();
    d["Tháng"] = d["Thời gian tạo đơn"].getMonth() + 1;
  });

  const nestedData = d3.rollups(
    rawData,
    v => {
      const doanhThuTong = d3.sum(v, d => d["Thành tiền"]);
      const skuTong = d3.sum(v, d => d["SL"]);
      const uniqueDates = d3.rollup(v, g => 1, d => `${d["Ngày"]}-${d["Tháng"]}`); // Sửa ở đây
      const soNgayXuatHien = uniqueDates.size;

      return {
        doanhThuTrungBinh: doanhThuTong / soNgayXuatHien,
        skuTrungBinh: skuTong / soNgayXuatHien,
        tongDoanhThu: doanhThuTong,
        tongSL: skuTong,
        soNgay: soNgayXuatHien
      };
    },
    d => d["Ngày"]
  );

  const data = nestedData.map(([ngay, values]) => ({
    ngay: ngay,
    doanhThuTrungBinh: values.doanhThuTrungBinh,
    skuTrungBinh: values.skuTrungBinh,
    tongDoanhThu: values.tongDoanhThu,
    tongSL: values.tongSL,
    soNgay: values.soNgay
  }));

  data.sort((a, b) => a.ngay - b.ngay);

  const x = d3.scaleBand()
    .domain(data.map(d => d.ngay))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.doanhThuTrungBinh)])
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.ngay))
    .range(d3.schemePaired);

  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d => `Ngày ${String(d).padStart(2, '0')}`))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g")
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d / 1_000_000).toFixed(0)} tr`));

  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.ngay))
    .attr("y", d => y(d.doanhThuTrungBinh))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.doanhThuTrungBinh))
    .attr("fill", d => color(d.ngay))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <strong>Ngày ${d.ngay}</strong><br/>
        Doanh thu TB: ${(d.doanhThuTrungBinh / 1_000_000).toFixed(0)} triệu VND<br/>
        Số lượng bán TB: ${d.skuTrungBinh.toFixed(0)} SKUs<br/>
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  svg.selectAll(".label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "label")
    .attr("x", d => x(d.ngay) + x.bandwidth() / 2)
    .attr("y", d => y(d.doanhThuTrungBinh) - 5)
    .attr("text-anchor", "middle")
    .style("fill", "black")
    .style("font-size", "12px")
    .text(d => `${(d.doanhThuTrungBinh / 1_000_000).toFixed(1)} tr`);

}).catch(error => {
  console.error("Lỗi khi load file CSV:", error);
});