export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-4">멀티 프로젝트 워크스페이스</h1>
      <ul className="list-disc pl-5">
        <li><a href="/bass-guitar" className="text-blue-500 hover:underline">베이스 시뮬레이터 프로젝트</a></li>
        <li><a href="/hand-gesture" className="text-blue-500 hover:underline">3D 핸드 제스처 프로젝트</a></li>
      </ul>
    </main>
  );
}
