// src/server.ts
import createApp from './app';
import { transcribe } from './services/blobStorage';

const app = createApp(transcribe);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
