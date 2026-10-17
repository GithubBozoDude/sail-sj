
function getPCInfo(userAgent: string | null) {
  const ua = userAgent || "";

  let os = "Unknown";

  if (/Windows NT 10\.0/i.test(ua)) {
    os = "Windows 10/11";
  } else if (/Windows NT 6\.3/i.test(ua)) {
    os = "Windows 8.1";
  } else if (/Windows NT 6\.2/i.test(ua)) {
    os = "Windows 8";
  } else if (/Windows NT 6\.1/i.test(ua)) {
    os = "Windows 7";
  } else if (/Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X ([\d_]+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  } else if (/Android/i.test(ua)) {
    os = "Android";
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = "iOS";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  let browser = "Unknown";
  let match: RegExpMatchArray | null;

  if ((match = ua.match(/Edg\/([\d.]+)/i))) {
    browser = `Edge ${match[1]}`;
  } else if ((match = ua.match(/OPR\/([\d.]+)/i))) {
    browser = `Opera ${match[1]}`;
  } else if ((match = ua.match(/Chrome\/([\d.]+)/i))) {
    browser = `Chrome ${match[1]}`;
  } else if ((match = ua.match(/Firefox\/([\d.]+)/i))) {
    browser = `Firefox ${match[1]}`;
  } else if ((match = ua.match(/Version\/([\d.]+).*Safari/i))) {
    browser = `Safari ${match[1]}`;
  }

  return { os, browser };
}
