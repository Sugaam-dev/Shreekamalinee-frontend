import ikatDressImg from "../../assets/images/categories/dress-material/ikat/ikat_dress_material.jpg";
import jamdaniDressImg from "../../assets/images/categories/dress-material/jamdani/jamdani_dress_material.jpg";
import kotaDoriyaDressImg from "../../assets/images/categories/dress-material/kota-doriya/kota_doriya_dress_material.jpg";
import maheshwariDressImg from "../../assets/images/categories/dress-material/maheshwari/maheshwari_dress_material.jpg";
import narayanPethDressImg from "../../assets/images/categories/dress-material/narayan-peth/narayan-1.jpg";

const ikatFiles = [
  "1db53742-71a2-4ea1-afad-85a05201be3a.jpeg", "234e02d1-76cf-4098-8199-a2ab9dd474d4.jpeg",
  "43b12608-f236-49e7-a1bb-17b21e50f683.jpeg", "51ee7ed8-9b6a-4d57-b857-4b7427319897.jpeg",
  "56a17130-a096-46d5-8282-32c1a52545f4.jpeg", "5e49b2af-372a-4d4f-bdea-939e20102686.jpeg",
  "6ef158db-2c52-46ae-af5d-17f51e41c244 (1).jpeg", "700a4c75-9d60-46d8-9957-0f41e3a6777b.jpeg",
  "861e2c9c-c9c8-4b19-affc-0ec025378bbe.jpeg", "b1e85ef7-da24-4da7-b2d3-9cb78696b89e (1).jpeg",
  "c09b2550-9c9f-495c-bfa6-8cfb62ef5211.jpeg", "cae51e02-a325-4983-82ab-58d80b264ad2.jpeg",
  "cb9202bd-bd56-4120-a075-feec60b7084d.jpeg", "e2a171a1-6107-4b01-b90a-e799a636e65d.jpeg",
  "f8a563af-a5bb-42a9-ad35-0b68cb38aee5.jpeg"
];

export const IKAT_DRESS_MATERIAL = ikatFiles.map((file, i) => ({
  id: 200 + i,
  name: i === 0 ? "Ikat Handloom Cotton Dress Material" : `Pochampally Ikat Unstitched Suit - Style ${i + 1}`,
  cat: "Dress Material",
  subcat: "Ikat",
  season: "Summer",
  price: 1800 + i * 100,
  mrp: Math.round((1800 + i * 100) * 1.25 / 100) * 100,
  type: "dressmaterial",
  tag: i === 0 ? "Bestseller" : (i === 1 ? "New" : null),
  image: i === 0 ? ikatDressImg : `/assets/images/categories/dress-material/ikat/${file}`,
  images: [i === 0 ? ikatDressImg : `/assets/images/categories/dress-material/ikat/${file}`],
  colors: ["#1a4a2e", "#d6a23f"],
  isSoldOut: false,
  highlights: {
    "Material composition": "100% Handloom Ikat Cotton",
    "Top fabric": "2.5 Meters Cotton-Silk Fabric",
    "Bottom fabric": "2.0 Meters Cotton Salwar Fabric",
    "Dupatta fabric": "2.25 Meters Handloom Dupatta",
    "Care instructions": "Gentle Hand Wash Separately",
    "Country of Origin": "India"
  },
  aboutThisItem: ["Hand-crafted Pochampally Ikat unstitched suit material set."]
}));

const jamdaniFiles = [
  "14bc6a31-d782-4a6a-9876-5dd450368ce6.jpeg", "331a39a5-68de-4500-b570-c662d2b36ccc.jpeg",
  "670436c0-3583-4bde-a0c9-b9670e82540b.jpeg", "90c72df3-ea7b-412f-9e77-7cf43a71374b.jpeg",
  "90f04b8e-8615-43b1-a43d-0172dd0a54cc.jpeg", "98ba0440-bb3c-443b-8d9b-0ad9bb77af2f.jpeg",
  "aa3df910-bb3c-4b76-9d88-9d3fcce194c5.jpeg", "c5c6aa43-17a6-4ec4-8f22-372b0bbc03c3.jpeg",
  "deb3dff7-4ee0-4081-805f-683e48e7f23a.jpeg", "e5adccc4-3bd0-4a97-91f9-851900357ee2.jpeg",
  "f218245d-dd76-4c61-9f29-563279a6679e.jpeg"
];

export const JAMDANI_DRESS_MATERIAL = Array.from({ length: 12 }, (_, i) => ({
  id: 215 + i,
  name: i === 0 ? "Jamdani Hand-Woven Cotton Dress Material" : `Bengal Jamdani Weave Unstitched Suit - Style ${i + 1}`,
  cat: "Dress Material",
  subcat: "Jamdani",
  season: "Festive",
  price: 2100 + i * 80,
  mrp: Math.round((2100 + i * 80) * 1.25 / 100) * 100,
  type: "dressmaterial",
  tag: i === 0 ? "Bestseller" : null,
  image: i === 0 ? jamdaniDressImg : (jamdaniFiles[i] ? `/assets/images/categories/dress-material/jamdani/${jamdaniFiles[i]}` : jamdaniDressImg),
  images: [i === 0 ? jamdaniDressImg : (jamdaniFiles[i] ? `/assets/images/categories/dress-material/jamdani/${jamdaniFiles[i]}` : jamdaniDressImg)],
  colors: ["#4a1a6e", "#d6a23f"],
  isSoldOut: i >= 11, // 11 image files available
  highlights: {
    "Material composition": "Fine Soft Jamdani Cotton",
    "Top fabric": "2.5 Meters Soft Jamdani Top",
    "Bottom fabric": "2.0 Meters Plain Cotton Salwar Fabric",
    "Dupatta fabric": "2.25 Meters Hand-woven Jamdani Dupatta",
    "Care instructions": "Gentle Hand Wash",
    "Country of Origin": "India"
  },
  aboutThisItem: ["Traditional Jamdani motif woven unstitched dress material."]
}));

export const KOTA_DORIYA_DRESS_MATERIAL = Array.from({ length: 25 }, (_, i) => ({
  id: 227 + i,
  name: `Rajasthan Kota Doriya Unstitched Suit - Style ${i + 1}`,
  cat: "Dress Material",
  subcat: "Kota Doriya",
  season: "Summer",
  price: 1600 + i * 70,
  mrp: Math.round((1600 + i * 70) * 1.25 / 100) * 100,
  type: "dressmaterial",
  tag: i === 0 ? "Bestseller" : null,
  image: i === 0 ? kotaDoriyaDressImg : `/assets/images/categories/dress-material/kota-doriya/kota_doriya_${i + 1}.jpg`,
  images: [i === 0 ? kotaDoriyaDressImg : `/assets/images/categories/dress-material/kota-doriya/kota_doriya_${i + 1}.jpg`],
  colors: ["#c0392b", "#4a7a1e"],
  isSoldOut: i >= 24, // 24 image files available
  highlights: { "Material composition": "Lightweight Kota Doriya Cotton", "Care instructions": "Gentle Wash", "Country of Origin": "India" },
  aboutThisItem: ["Translucent checkered Kota Doriya suit set with embroidered dupatta."]
}));

export const MAHESHWARI_DRESS_MATERIAL = Array.from({ length: 4 }, (_, i) => ({
  id: 252 + i,
  name: `Handloom Maheshwari Silk Cotton Suit - Style ${i + 1}`,
  cat: "Dress Material",
  subcat: "Maheshwari",
  season: "Autumn",
  price: 2400 + i * 150,
  mrp: Math.round((2400 + i * 150) * 1.25 / 100) * 100,
  type: "dressmaterial",
  tag: null,
  image: maheshwariDressImg,
  images: [maheshwariDressImg],
  colors: ["#bd5b34", "#d6a23f"],
  isSoldOut: true,
  highlights: { "Material composition": "Maheshwari Silk Cotton", "Care instructions": "Dry Clean", "Country of Origin": "India" },
  aboutThisItem: ["Regal Maheshwari zari border dress material."]
}));

const narayanPethFiles = [
  "narayan -2.jpeg", "narayan -3.jpeg", "narayan -5.jpeg", "narayan -6.jpeg",
  "narayan -7.jpeg", "narayan -8.jpeg", "narayan -9.jpeg", "narayan -10.jpeg",
  "narayan -11.jpeg", "narayan -12.jpeg", "narayan -13.jpeg", "narayan -14.jpeg",
  "narayan -15.jpeg", "narayan -16.jpeg", "narayan -17.jpeg", "narayan -18.jpeg",
  "narayan -19.jpeg", "narayan -20.jpeg", "narayan -21.jpeg", "narayan -22.jpeg",
];

export const NARAYAN_PETH_DRESS_MATERIAL = Array.from({ length: 21 }, (_, i) => ({
  id: 256 + i,
  name: i === 0 ? "Narayan Peth Handwoven Cotton Suit" : `Traditional Narayan Peth Border Suit - Style ${i + 1}`,
  cat: "Dress Material",
  subcat: "Narayan Peth",
  season: "Festive",
  price: 2000 + i * 120,
  mrp: Math.round((2000 + i * 120) * 1.25 / 100) * 100,
  type: "dressmaterial",
  tag: i === 0 ? "Bestseller" : null,
  image: i === 0 ? narayanPethDressImg : `/assets/images/categories/dress-material/narayan-peth/${narayanPethFiles[i - 1]}`,
  images: [i === 0 ? narayanPethDressImg : `/assets/images/categories/dress-material/narayan-peth/${narayanPethFiles[i - 1]}`],
  colors: ["#2c3e50", "#bd5b34"],
  isSoldOut: false,
  highlights: { "Material composition": "Narayan Peth Cotton", "Care instructions": "Dry Clean", "Country of Origin": "India" },
  aboutThisItem: ["Classic Narayan Peth zari border suit material."]
}));

export const AJRAKH_DRESS_MATERIAL = Array.from({ length: 6 }, (_, i) => ({
  id: 261 + i,
  name: i === 0 ? "Authentic Kutch Ajrakh Block Print Cotton Suit" : `Modal Silk Ajrakh Hand-Block Dress Material - Style ${i + 1}`,
  cat: "Dress Material",
  subcat: "Ajrakh",
  season: "All Season",
  price: 2250 + i * 120,
  mrp: Math.round((2250 + i * 120) * 1.25 / 100) * 100,
  type: "dressmaterial",
  tag: i === 0 ? "Bestseller" : (i === 1 ? "New" : null),
  image: ikatDressImg,
  images: [ikatDressImg],
  colors: ["#bd5b34", "#1a4a2e"],
  isSoldOut: false,
  highlights: {
    "Material composition": "100% Modal Silk & Ajrakh Block Cotton",
    "Top fabric": "2.5 Meters Ajrakh Hand-block Printed Top",
    "Bottom fabric": "2.0 Meters Plain Cotton Salwar Fabric",
    "Dupatta fabric": "2.4 Meters Modal Silk Printed Dupatta",
    "Care instructions": "Dry Clean / Gentle Wash with Cold Water",
    "Country of Origin": "India"
  },
  aboutThisItem: ["Traditional Kutch Ajrakh hand block printed unstitched suit material using natural mineral pigments."]
}));

export const DRESS_MATERIAL_PRODUCTS = [
  ...IKAT_DRESS_MATERIAL,
  ...JAMDANI_DRESS_MATERIAL,
  ...KOTA_DORIYA_DRESS_MATERIAL,
  ...MAHESHWARI_DRESS_MATERIAL,
  ...NARAYAN_PETH_DRESS_MATERIAL,
  ...AJRAKH_DRESS_MATERIAL,
];
