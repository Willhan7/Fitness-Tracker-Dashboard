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

// 渲染表格，支持单元格双击编辑和删除
function renderTable() {
  tableBody.innerHTML = '';
  records.slice().reverse().forEach((record, idx) => {
    const tr = document.createElement('tr');
    const realIdx = records.length - 1 - idx;
    // 每个单元格加 data-idx 和 data-field
    tr.innerHTML = `
      <td class="editable" data-idx="${realIdx}" data-field="date">${record.date}</td>
      <td class="editable" data-idx="${realIdx}" data-field="weight">${record.weight}</td>
      <td class="editable" data-idx="${realIdx}" data-field="exercise">${record.exercise}</td>
      <td class="editable" data-idx="${realIdx}" data-field="note">${record.note || ''}</td>
      <td>
        <button class="delete-btn" data-idx="${realIdx}">删除/Delete</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
  // 绑定删除事件
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(this.dataset.idx);
      if (confirm('确定要删除这条记录吗？\nAre you sure to delete this record?')) {
        records.splice(idx, 1);
        saveRecords();
        renderTable();
        renderChart();
      }
    };
  });
  // 绑定双击编辑事件
  document.querySelectorAll('.editable').forEach(td => {
    td.ondblclick = function() {
      enterCellEdit(this);
    };
  });
}

// 单元格进入编辑状态
function enterCellEdit(td) {
  const idx = parseInt(td.dataset.idx);
  const field = td.dataset.field;
  const oldValue = td.textContent;
  let input;
  if (field === 'date') {
    input = document.createElement('input');
    input.type = 'date';
    input.value = records[idx][field];
  } else if (field === 'weight') {
    input = document.createElement('input');
    input.type = 'number';
    input.step = '0.1';
    input.value = records[idx][field];
  } else if (field === 'exercise') {
    input = document.createElement('input');
    input.type = 'number';
    input.step = '1';
    input.value = records[idx][field];
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.value = records[idx][field] || '';
  }
  input.style.width = '90%';
  td.innerHTML = '';
  td.appendChild(input);
  input.focus();
  input.select();

  // 保存/取消逻辑
  input.onkeydown = function(e) {
    if (e.key === 'Enter') {
      let newValue = input.value.trim();
      if (field === 'date') {
        if (!newValue) {
          alert('日期不能为空！\nDate cannot be empty!');
          return;
        }
        // 检查日期唯一性
        if (records.some((r, j) => r.date === newValue && j !== idx)) {
          alert('该日期已有其他记录！\nThis date already has another record!');
          return;
        }
        records[idx][field] = newValue;
      } else if (field === 'weight') {
        newValue = parseFloat(newValue);
        if (isNaN(newValue)) {
          alert('体重必须为数字！\nWeight must be a number!');
          return;
        }
        records[idx][field] = newValue;
      } else if (field === 'exercise') {
        newValue = parseInt(newValue);
        if (isNaN(newValue)) {
          alert('运动时间必须为数字！\nExercise time must be a number!');
          return;
        }
        records[idx][field] = newValue;
      } else {
        records[idx][field] = newValue;
      }
      // 日期变动后重新排序
      if (field === 'date') {
        records.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      saveRecords();
      renderTable();
      renderChart();
    } else if (e.key === 'Escape') {
      td.innerHTML = oldValue;
    }
  };
  // 失焦时还原（不保存）
  input.onblur = function() {
    td.innerHTML = oldValue;
  };
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