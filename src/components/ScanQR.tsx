import { useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';

type Props = {
  onScanComplete: () => void;
};

export default function ScanQR({ onScanComplete }: Props) {
  const [isScanning, setIsScanning] = useState(true);
  const [qrImage, setQrImage] = useState<string | null>(null);

  const fetchQrCode = async () => {
    try {
      // const response = await fetch(`${BASE_URL}/api/default/auth/qr?format=image`, {
      //   headers: {
      //     'accept': 'image/png',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error('User is connected');
      // }

      // const blob = await response.blob();
      // const imageUrl = URL.createObjectURL(blob);
      //setQrImage(imageUrl);
      // throw error
      throw new Error('User is connected');
  
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setIsScanning(false);
      onScanComplete();
    }
  };

  useEffect(() => {
    fetchQrCode();
    const interval = setInterval(fetchQrCode, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [onScanComplete]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Scan WhatsApp QR Code</h1>
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-64 h-64 border-2 border-gray-300 rounded-lg flex items-center justify-center">
              {qrImage ? (
                <img src={qrImage} alt="QR Code" className="w-48 h-48" />
              ) : (
                <QrCode className="w-48 h-48 text-gray-400" />
              )}
            </div>
            
            <div className="mt-4">
              {isScanning ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent"></div>
                  <p className="text-sm text-gray-600">Waiting for scan...</p>
                </div>
              ) : (
                <div className="text-green-600 font-medium">Connected!</div>
              )}
            </div>

            <p className="text-sm text-gray-500 max-w-md mt-4">
              Open WhatsApp on your phone, go to Settings - Linked Devices and scan this QR code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}