// app/layout.js
import "./globals.css";

export const metadata = {
  title: "Utilization Tracker",
  description: "Professional Services Utilization Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
