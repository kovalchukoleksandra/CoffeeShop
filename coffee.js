const items = [
  {name:"Капучино", type:"coffee", price:50, img:"img/img2.png", desc:"Кава з молоком"},
  {name:"Еспресо", type:"coffee", price:30, img:"img/img1.png", desc:"Міцна кава"},
  {name:"Чай Матча", type:"tea", price:70, img:"img/img3.jpg", desc:"Японський чай"}
];

const newsData = [
  {title:"Знижки!", text:"-20% на каву", status:"very"},
  {title:"Нові пропозиції", text:"Чай Матча", status:"important"},
  {title:"Акція", text:"2 за ціною 1", status:"normal"}
];

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

  let result = [...items];

  if (type !== "all") {
    result = result.filter(i => i.type === type);
  }

  result = result.filter(i => i.price >= min && i.price <= max);

  const search = document.getElementById("search").value.toLowerCase();
  if (search) {
    result = result.filter(i =>
      i.name.toLowerCase().includes(search)
    );
  }

  if (sort === "name") {
    result.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sort === "price") {
    result.sort((a, b) => a.price - b.price);
  }

  renderItems(result);
}

function toggleDesc(btn) {
  btn.nextElementSibling.classList.toggle("hidden");
}


function renderNews() {
  const container = document.getElementById("news");

  newsData.forEach(n => {
    const div = document.createElement("div");

    div.className = "news-item " + n.status;

    div.innerHTML = `
      <h4>${n.title}</h4>
      <p class="hidden">${n.text}</p>
    `;

    div.onclick = () => {
      div.querySelector("p").classList.toggle("hidden");
    };

    container.appendChild(div);
  });
}

function toggleCart() {
  document.getElementById("cart").classList.toggle("hidden");
}

function addToCart(name) {
  cart.push(name);
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cart-items");

  container.innerHTML = cart.map((item, index) => `
    <li>
      ${item}
      <span onclick="removeFromCart(${index})" style="cursor:pointer; margin-left:40px;">✖</span>
    </li>
  `).join("");
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

document.getElementById("search").addEventListener("input", applyFilters);

renderItems(items);
renderNews();