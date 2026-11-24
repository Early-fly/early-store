import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, addDoc, updateDoc, deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

export async function listProducts() {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'products'), where('isPublished', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSettings() {
  if (!db) return {};
  const snap = await getDoc(doc(db, 'storeSettings', 'main'));
  return snap.exists() ? snap.data() : {};
}

export async function createOrder(payload) {
  if (!db) throw new Error('Firebase belum dikonfigurasi.');
  if (!payload.items?.length) throw new Error('Keranjang kosong.');

  // Harga dan nama diambil ulang dari Firestore, bukan dari data keranjang browser.
  const lines = [];
  let subtotal = 0;
  for (const item of payload.items) {
    const snap = await getDoc(doc(db, 'products', item.productId));
    if (!snap.exists()) throw new Error('Salah satu produk tidak ditemukan.');
    const p = snap.data();
    const qty = Number(item.quantity);
    if (!p.isPublished || !Number.isInteger(qty) || qty < 1 || qty > Number(p.stock || 0)) {
      throw new Error(`Stok/produk ${p.name || ''} tidak tersedia. Admin akan mengonfirmasi stok.`);
    }
    const lineTotal = Number(p.price) * qty;
    if (!Number.isFinite(lineTotal) || lineTotal < 0) throw new Error('Harga produk tidak valid.');
    lines.push({
      productId: item.productId,
      productNameSnapshot: p.name,
      productPriceSnapshot: Number(p.price),
      quantity: qty,
      subtotal: lineTotal
    });
    subtotal += lineTotal;
  }

  const settings = await getSettings();
  if (payload.paymentMethod === 'transfer' && settings.transferEnabled === false) throw new Error('Transfer belum aktif.');
  if (payload.paymentMethod === 'qris' && settings.qrisEnabled === false) throw new Error('QRIS belum aktif.');
  if (payload.paymentMethod === 'cash' && settings.cashEnabled === false) throw new Error('Cash belum aktif.');
  const shippingCost = payload.orderType === 'delivery' ? Number(settings.shippingCost || 0) : 0;
  const orderCode = `ES-${Date.now().toString(36).toUpperCase()}`;
  const order = {
    orderCode,
    customerId: payload.customerId,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    orderType: payload.orderType,
    deliveryAddress: payload.deliveryAddress || '',
    latitude: payload.latitude?.latitude ?? null,
    longitude: payload.latitude?.longitude ?? null,
    pickupTime: payload.pickupTime || '',
    deliveryNote: payload.deliveryNote || '',
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentMethod === 'cash' ? 'PENDING_CASH' : 'MENUNGGU_VERIFIKASI',
    paymentReference: payload.paymentReference || '',
    orderStatus: 'Menunggu Konfirmasi',
    trackingUrl: '',
    items: lines,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, 'orders'), order);
  return { orderId: ref.id, orderCode };
}

export async function adminList(collectionName) {
  if (!db) throw new Error('Firebase belum dikonfigurasi');
  const snap = await getDocs(query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(100)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function saveProduct(data, id) {
  if (!db) throw new Error('Firebase belum dikonfigurasi');
  if (id) await updateDoc(doc(db, 'products', id), { ...data, updatedAt: serverTimestamp() });
  else await addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function removeProduct(id) {
  if (!db) throw new Error('Firebase belum dikonfigurasi');
  await deleteDoc(doc(db, 'products', id));
}
