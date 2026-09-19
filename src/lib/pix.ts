/**
 * Central Bank of Brazil (Bacen) EMV QRCPS-MPM (BR Code / PIX Copia e Cola) utility.
 * Complies with Bacen standards without external dependencies.
 */

export interface PixPayloadOptions {
  pixKey: string;
  amount: number;
  merchantName?: string;
  merchantCity?: string;
  txid?: string;
}

/**
 * Strips accents/diacritics and non-alphanumeric characters (keeping spaces),
 * and converts to uppercase for EMV compliance.
 */
export function sanitizeText(text: string, maxLength: number): string {
  const sanitized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9 ]/g, '') // alphanumeric and spaces only
    .trim()
    .toUpperCase();

  return sanitized.slice(0, maxLength);
}

/**
 * Formats an EMV tag, length (2 digits zero-padded), and value.
 */
function formatEmvField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

/**
 * Calculates CRC-16/CCITT-FALSE (polynomial 0x1021, initial value 0xFFFF).
 */
export function calculateCrc16(payload: string): string {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generates a standard-compliant PIX "Copia e Cola" (BR Code) string.
 */
export function generatePixPayload(options: PixPayloadOptions): string {
  const { pixKey, amount, merchantName = 'DIVIDI', merchantCity = 'BRASILIA', txid = '***' } = options;

  if (!pixKey || pixKey.trim() === '') {
    throw new Error('Chave PIX é obrigatória');
  }

  if (amount <= 0 || isNaN(amount)) {
    throw new Error('Valor da doação deve ser maior que zero');
  }

  // 00: Payload Format Indicator (01)
  const formatIndicator = formatEmvField('00', '01');

  // 01: Point of Initiation Method (12: static with predetermined amount)
  const pointOfInitiation = formatEmvField('01', '12');

  // 26: Merchant Account Information
  // 00: GUI (br.gov.bcb.pix)
  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  // 01: Chave PIX
  const key = formatEmvField('01', pixKey.trim());
  const merchantAccountInfo = formatEmvField('26', `${gui}${key}`);

  // 52: Merchant Category Code (0000)
  const mcc = formatEmvField('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  const currency = formatEmvField('53', '986');

  // 54: Transaction Amount (e.g., 50.00)
  const formattedAmount = amount.toFixed(2);
  const amountField = formatEmvField('54', formattedAmount);

  // 58: Country Code (BR)
  const countryCode = formatEmvField('58', 'BR');

  // 59: Merchant Name (alphanumeric, max 25 chars)
  const sanitizedName = sanitizeText(merchantName, 25) || 'DIVIDI';
  const nameField = formatEmvField('59', sanitizedName);

  // 60: Merchant City (alphanumeric, max 15 chars)
  const sanitizedCity = sanitizeText(merchantCity, 15) || 'BRASILIA';
  const cityField = formatEmvField('60', sanitizedCity);

  // 62: Additional Data Field (05: txid)
  const sanitizedTxid = sanitizeText(txid, 25) || '***';
  const txidSubField = formatEmvField('05', sanitizedTxid);
  const additionalDataField = formatEmvField('62', txidSubField);

  // 63: CRC16 prefix (tag 63 + length 04)
  const crcPrefix = '6304';

  const rawPayload = `${formatIndicator}${pointOfInitiation}${merchantAccountInfo}${mcc}${currency}${amountField}${countryCode}${nameField}${cityField}${additionalDataField}${crcPrefix}`;

  const crc = calculateCrc16(rawPayload);

  return `${rawPayload}${crc}`;
}
