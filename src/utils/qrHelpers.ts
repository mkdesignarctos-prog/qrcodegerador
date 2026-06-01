export const buildWifi = (ssid: string, password: string, encryption: string, hidden: boolean) => {
  const escapeString = (str: string) => {
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/,/g, '\\,');
  };
  
  const safeSsid = escapeString(ssid || 'Wifi-Network');
  const safePass = escapeString(password);
  
  let qr = `WIFI:S:${safeSsid};T:${encryption === 'nopass' ? 'nopass' : encryption};`;
  if (password && encryption !== 'nopass') qr += `P:${safePass};`;
  if (hidden) qr += `H:true;`;
  qr += `;`;
  return qr;
};

export const buildVCard = (data: any) => {
  let qr = `BEGIN:VCARD\nVERSION:3.0\n`;
  qr += `N:${data.lastName || ''};${data.firstName || ''};;;\n`;
  qr += `FN:${data.firstName || ''} ${data.lastName || ''}\n`;
  if (data.company) qr += `ORG:${data.company}\n`;
  if (data.title) qr += `TITLE:${data.title}\n`;
  if (data.phone) qr += `TEL:${data.phone}\n`;
  if (data.email) qr += `EMAIL:${data.email}\n`;
  if (data.website) qr += `URL:${data.website}\n`;
  if (data.address) qr += `ADR:;;${data.address};;;;\n`;
  qr += `END:VCARD`;
  return qr;
};

export const buildEmail = (email: string, subject: string, body: string) => {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const buildWhatsapp = (phone: string, text: string) => {
  // Remove non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

export const buildSms = (phone: string, text: string) => {
  return `smsto:${phone}:${text}`;
};

export const buildPhone = (phone: string) => {
  return `tel:${phone}`;
};
