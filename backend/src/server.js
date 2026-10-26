import 'dotenv/config';
import app from './app.js';

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`metallica.vis API escuchando en http://localhost:${port}`);
});
