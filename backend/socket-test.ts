import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);

  socket.emit('joinStockRoom', {
    symbol: 'SPC',
  });
});

socket.on('joinedStockRoom', (data) => {
  console.log('Joined room:', data);
});

socket.on('orderbook:update', (data) => {
  console.log('Order book update:', JSON.stringify(data, null, 2));
});

socket.on('trade:new', (data) => {
  console.log('New trade:', JSON.stringify(data, null, 2));
});

socket.on('stock:price:update', (data) => {
  console.log('Stock price update:', JSON.stringify(data, null, 2));
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
