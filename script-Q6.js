const margin = {top: 60, right: 20, bottom: 80, left: 50},
  width = 1500 - margin.left - margin.right,
  height = 600 - margin.top - margin.bottom;

const svg = d3.select("#q6-chart")
          .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("#q6-tooltip");

d3.csv("data_ggsheet-data.csv").then(rawData => {
rawData.forEach(d => {
d["Thành tiền"] = +d["Thành tiền"];
d["Số lượng"] = +d["Số lượng"];
let date = new Date(d["Thời gian tạo đơn"]);
if (!isNaN(date.getTime())) {
  d.Tháng = date.getMonth() + 1;
  d.Giờ = date.getHours();
  d.Ngày = date.toISOString().split('T')[0];
}
});

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00-${i.toString().padStart(2, '0')}:59`);

const filteredData = rawData.filter(d => d.Giờ >= 8 && d.Giờ <= 23);
const groupedData = d3.group(filteredData, d => d.Giờ);

const data = [];
groupedData.forEach((orders, hour) => {
const uniqueDays = new Set(orders.map(d => d.Ngày)).size;
const doanhThuTB = uniqueDays > 0 ? d3.sum(orders, d => d["Thành tiền"]) / uniqueDays : 0;
const soLuongTB = uniqueDays > 0 ? d3.sum(orders, d => d["SL"]) : 0;
data.push({ KhungGiờ: timeSlots[hour], doanhThuTB, soLuongTB, Giờ: hour });
});

const x = d3.scaleBand()
          .domain(timeSlots.slice(8, 24))
          .range([0, width])
          .padding(0.2);

const y = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.doanhThuTB)])
          .nice()
          .range([height, 0]);

const color = d3.scaleOrdinal(d3.schemeTableau10);

svg.append("g")
 .attr("transform", `translate(0, ${height})`)
 .call(d3.axisBottom(x).tickSize(0))
 .selectAll("text")
 .attr("transform", "rotate(-45)")
 .style("text-anchor", "end");

svg.append("g")
 .call(d3.axisLeft(y)
         .ticks(10)
         .tickFormat(d3.format(".1s"))
         .tickSizeOuter(0));

svg.selectAll(".bar")
 .data(data)
 .enter()
 .append("rect")
 .attr("class", "bar")
 .attr("x", d => x(d.KhungGiờ))
 .attr("y", d => y(d.doanhThuTB))
 .attr("width", x.bandwidth())
 .attr("height", d => height - y(d.doanhThuTB))
 .attr("fill", d => color(d.Giờ))
 .on("mouseover", (event, d) => {
   tooltip.style("display", "block")
          .html(`Khung Giờ: ${d.KhungGiờ}<br>
                 Doanh thu TB: ${d3.format(",.0f")(d.doanhThuTB)} VND<br>
                 Số lượng TB: ${d3.format(",.0f")(d.soLuongTB)} SKUs`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
 })
 .on("mousemove", event => {
   tooltip.style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 20}px`);
 })
 .on("mouseout", () => {
   tooltip.style("display", "none");
 });

svg.selectAll("#q6-label")
 .data(data)
 .enter()
 .append("text")
 .attr("class", "q6-label")
 .attr("x", d => x(d.KhungGiờ) + x.bandwidth() / 2)
 .attr("y", d => y(d.doanhThuTB) - 5)
 .style ('font-size','10')
 .style ("text-anchor", "middle")
 .text(d => d3.format(",.0f")(d.doanhThuTB) + " VND");
}).catch(error => {
console.error("Lỗi khi load file CSV:", error);
});