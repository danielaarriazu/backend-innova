import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuramos el motor de almacenamiento 
const storageLogo = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'emprendebot_logos', // Carpeta en Cloudinary donde se guardarán los logos
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Formatos permitidos
      public_id: `logo-${Date.now()}`, // Nombre único del archivo
    };
  },
});
export const uploadLogo = multer({ 
  storage: storageLogo,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const storageProducto = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => ({
    folder: 'emprendebot_productos', 
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    public_id: `prod-${Date.now()}`,
  }),
});
export const uploadProducto = multer({ 
  storage: storageProducto, 
  limits: { fileSize: 5 * 1024 * 1024 } });
