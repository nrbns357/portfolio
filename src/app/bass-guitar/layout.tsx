export default function BassGuitarLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bass-guitar-root min-h-screen bg-bass-amp text-white">
      {/* 베이스 전용 Context Provider 등이 여기에 배치됩니다 */}
      {children}
    </div>
  );
}
