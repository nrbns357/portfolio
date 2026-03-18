export default function HandGestureLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="hand-gesture-root min-h-screen bg-gesture-bg text-white">
      {/* 3D 제스처 전용 Context Provider 등이 여기에 배치됩니다 */}
      {children}
    </div>
  );
}
