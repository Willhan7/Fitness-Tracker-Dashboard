// 健身打卡仪表板脚本
const STORAGE_KEY = 'fitness_records';
let records = [];

// DOM 元素
const form = document.getElementById('record-form');
const tableBody = document.querySelector('#record-table tbody');
const chartCanvas = document.getElementById('trendChart');
let trendChart = null;

// 加载本地数据
function loadRecords() {
  const data = localStorage.getItem(STORAGE_KEY);
  records = data ? JSON.parse(data) : [];
}

// 保存到本地
function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// 渲染表格
function renderTable() {
  tableBody.innerHTML = '';
  records.slice().reverse().forEach(record => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${record.date}</td>
      <td>${record.weight}</td>
      <td>${record.exercise}</td>
      <td>${record.note || ''}</td>
    `;
    tableBody.appendChild(tr);
  });
}

// 获取最近 N 天的数据
function getRecentRecords(days = 7) {
  const today = new Date();
  return records.filter(r => {
    const d = new Date(r.date);
    return (today - d) / (1000*60*60*24) < days;
  });
}

// 渲染图表
function renderChart() {
  const showAll = records.length <= 7;
  const dataToShow = showAll ? records : getRecentRecords(7);
  const labels = dataToShow.map(r => r.date);
  const weights = dataToShow.map(r => r.weight);
  const exercises = dataToShow.map(r => r.exercise);

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '体重 (kg) / Weight (kg)',
          data: weights,
          borderColor: '#2d8cf0',
          backgroundColor: 'rgba(45,140,240,0.08)',
          yAxisID: 'y',
          tension: 0.3,
          pointRadius: 4,
        },
        {
          label: '运动时间 (分钟) / Exercise Time (min)',
          data: exercises,
          borderColor: '#43c59e',
          backgroundColor: 'rgba(67,197,158,0.08)',
          yAxisID: 'y1',
          tension: 0.3,
          pointRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: { display: false }
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: '体重 (kg) / Weight (kg)' }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: '运动时间 (分钟) / Exercise Time (min)' }
        }
      }
    }
  });
}

// 表单提交
form.addEventListener('submit', function(e) {
  e.preventDefault();
  const date = form.date.value;
  const weight = parseFloat(form.weight.value);
  const exercise = parseInt(form.exercise.value);
  const note = form.note.value.trim();
  if (!date || isNaN(weight) || isNaN(exercise)) return;
  // 检查是否已存在该日期记录
  const exist = records.find(r => r.date === date);
  if (exist) {
    if (!confirm('该日期已有记录，是否覆盖？\nThis date already has a record, overwrite?')) return;
    Object.assign(exist, { weight, exercise, note });
  } else {
    records.push({ date, weight, exercise, note });
  }
  records.sort((a, b) => new Date(a.date) - new Date(b.date));
  saveRecords();
  renderTable();
  renderChart();
  form.reset();
});

// 初始化
function init() {
  loadRecords();
  renderTable();
  renderChart();
}
init(); 