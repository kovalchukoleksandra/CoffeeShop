const items = [
  {name:"Капучино", type:"coffee", price:50, img:"img/img2.png", desc:"Кава з молоком"},
  {name:"Еспресо", type:"coffee", price:30, img:"img/img1.png", desc:"Міцна кава"},
  {name:"Чай Матча", type:"tea", price:70, img:"img/img3.jpg", desc:"Японський чай"}
];

const newsData = [
    { title: "Знижки!", text: "-20% на каву", status: "very", date: "2026-03-20 10:30" },
    { title: "Нові пропозиції", text: "Чай Матча вже у продажу", status: "important", date: "2026-03-21 09:15" },
    { title: "Акція", text: "2 за ціною 1 тільки сьогодні", status: "normal", date: "2026-03-21 14:00" },
    { title: "Відкриття!", text: "Ми відкрили нову терасу!", status: "normal", date: "2026-03-19 18:45" }
];

let displayedNewsCount = 2; 
let lastResult = [...items];
let cart = [];

function renderItems(data) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${item.img}">
      <h3>${item.name}</h3>
      <p>${item.price} грн</p>
      <button onclick="toggleDesc(this)">Деталі</button>
      <p class="hidden">${item.desc}</p>
      <button onclick="addToCart('${item.name}')">Купити</button>
    `;

    container.appendChild(card);
  });
}

function applyFilters() {
    const type = document.getElementById("filter").value;
    const sort = document.getElementById("sort").value;
    const min = +document.getElementById("minPrice").value || 0;
    const max = +document.getElementById("maxPrice").value || Infinity;
    const search = document.getElementById("search").value.toLowerCase();

    let result = items.filter(i => 
        (type === "all" || i.type === type) &&
        (i.price >= min && i.price <= max) &&
        (i.name.toLowerCase().includes(search))
    );

    if (sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price") result.sort((a, b) => a.price - b.price);

    lastResult = result; 
    renderItems(result);
    drawCharts();        
}

function toggleDesc(btn) {
  btn.nextElementSibling.classList.toggle("hidden");
}

function renderNews() {
    const titlesContainer = document.getElementById("news-titles");
    if (!titlesContainer) return;
    titlesContainer.innerHTML = "";
    const sortedNews = [...newsData].sort((a, b) => new Date(b.date) - new Date(a.date));
    const newsToShow = sortedNews.slice(0, displayedNewsCount);

    newsToShow.forEach((n) => {
        const div = document.createElement("div");
        div.className = `news-title-item ${n.status}`;
        
        const time = n.date.split(" ")[1]; 
        div.innerHTML = `
            <span>${time}</span>
            <div class="title-text">${n.title}</div>
        `;

        div.onclick = () => {
            document.querySelectorAll('.news-title-item').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            
            showNewsBody(n);
        };
        titlesContainer.appendChild(div);
    });

    const loadMoreBtn = document.getElementById("load-more-news");
    if (loadMoreBtn) {
        loadMoreBtn.style.display = displayedNewsCount >= newsData.length ? "none" : "block";
    }
}

function showNewsBody(news) {
    const contentArea = document.getElementById("active-news-body");
    contentArea.innerHTML = `
        <h3>${news.title}</h3>
        <p style="color: gray; font-size: 0.8em;">Дата: ${news.date}</p>
        <hr>
        <p>${news.text}</p>
    `;
}

function loadMoreNews() {
    displayedNewsCount += 2; 
    renderNews();
}


function toggleCart() {
  document.getElementById("cart").classList.toggle("hidden");
}

function addToCart(name) {
  const item = items.find(i => i.name === name);

  const existing = cart.find(i => i.name === name);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      name: item.name,
      price: item.price,
      qty: 1
    });
  }

  renderCart();
}

function sendOrder() {
    if (cart.length === 0) return;

    const infoContainer = document.getElementById("order-info");
    const totalSum = document.getElementById("total").innerText;
    
    const orderList = cart.map(item => `<li>${item.name} — ${item.qty} шт.</li>`).join("");

    infoContainer.innerHTML = `
        <p>Дякуємо! Ви замовили:</p>
        <ul>${orderList}</ul>
        <p><strong>${totalSum}</strong></p>
    `;

    document.getElementById("order-modal").classList.remove("hidden");

    cart = [];
    renderCart();
    toggleCart(); 
}

function closeOrderModal() {
    document.getElementById("order-modal").classList.add("hidden");
}
function renderCart() {
  const container = document.getElementById("cart-items");

  let total = 0;

  container.innerHTML = cart.map((item, index) => {
    const sum = item.price * item.qty;
    total += sum;

    return `
  <li class="cart-item">
    <span class="name">${item.name}</span>

    <span class="price">
  <span class="price-text">${item.price} грн ×</span>
  <input type="number" min="1" value="${item.qty}" 
    onchange="changeQty(${index}, this.value)">
</span>

    <span class="sum">${sum} грн</span>

    <span onclick="removeFromCart(${index})" class="remove-btn">✖</span>
  </li>
`;
  }).join("");

  document.getElementById("total").innerText = "Разом: " + total + " грн";
  const btn = document.getElementById("checkout-btn");
  if (btn) {
    btn.disabled = cart.length === 0;
  }
}
function changeQty(index, value) {
  cart[index].qty = +value;
  renderCart();
}


function removeFromCart(index) {
  cart.splice(index, 1);
  renderCart();
}

function openModal() {
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}

function drawCharts() {
    const canvas = document.getElementById("myCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const chartType = document.getElementById("chart-type").value;
    const data = lastResult;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (data.length === 0) {
        ctx.fillStyle = "#000";
        ctx.fillText("Немає даних для аналізу", 250, 200);
        return;
    }

    if (chartType === "bar") {
        const maxPrice = Math.max(...data.map(i => i.price));
        data.forEach((item, i) => {
            const h = (item.price / maxPrice) * 280; 
            const x = 60 + i * 100;
            const y = 350 - h;

            ctx.fillStyle = "#8b5e3c";
            ctx.fillRect(x, y, 60, h); 

            ctx.fillStyle = "#333";
            ctx.font = "bold 12px Arial";
            ctx.fillText(item.price + "₴", x + 15, y - 10); 
            ctx.fillText(item.name.substring(0, 10), x, 370); 
        });

    } else if (chartType === "pie") {
        const stats = data.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {});

        let lastAngle = 0;
        const colors = { "coffee": "#6F4E37", "tea": "#50C878" }; 
        const total = data.length;

        Object.keys(stats).forEach((type) => {
            const angle = (stats[type] / total) * Math.PI * 2;
            
            ctx.fillStyle = colors[type] || "#ccc";
            ctx.beginPath();
            ctx.moveTo(300, 200);
            ctx.arc(300, 200, 130, lastAngle, lastAngle + angle);
            ctx.fill();

            const midAngle = lastAngle + angle / 2;
            const tx = 300 + Math.cos(midAngle) * 160;
            const ty = 200 + Math.sin(midAngle) * 160;
            
            ctx.fillStyle = "#333";
            ctx.font = "bold 13px Arial";
            const percent = Math.round((stats[type] / total) * 100);
            ctx.fillText(`${type.toUpperCase()} (${percent}%)`, tx - 40, ty);

            lastAngle += angle;
        });

    } else if (chartType === "line") {
        const maxPrice = Math.max(...data.map(i => i.price));
       
        ctx.beginPath(); 
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#8b5e3c";

        data.forEach((item, i) => {
            const x = 80 + i * 150;
            const y = 350 - (item.price / maxPrice) * 280;

            if (i === 0) ctx.moveTo(x, y); 
            else ctx.lineTo(x, y);         
        });
        
        ctx.stroke(); 

        data.forEach((item, i) => {
            const x = 80 + i * 150;
            const y = 350 - (item.price / maxPrice) * 280;

            ctx.fillStyle = "#5d3a1a";
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#333";
            ctx.font = "12px Arial";
            ctx.fillText(item.price + "₴", x - 15, y - 15);
            ctx.fillText(item.name, x - 20, 370);
        });
    }
}

document.getElementById("search").addEventListener("input", applyFilters);
renderItems(items);
renderNews();
renderCart();
drawCharts();
