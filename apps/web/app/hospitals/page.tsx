import { HospitalSearch } from '@/components/HospitalSearch';

export const dynamic = 'force-static';

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function HospitalsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">🏥 햄스터 병원 찾기</h1>
        <p className="mt-1 text-sm text-cocoa-300">
          햄찌를 진료하는 동물병원은 흔하지 않아요. 지역을 고르면 네이버 지도에서 가까운 병원을 찾아드려요.
        </p>
      </header>

      <HospitalSearch />

      <section className="space-y-3">
        <h2 className="font-semibold text-cocoa-500">지역으로 바로 찾기</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <a
              key={r}
              href={`https://map.naver.com/p/search/${encodeURIComponent(r + ' 햄스터 동물병원')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="badge bg-cream-100 text-cocoa-500 hover:bg-peach-100 hover:text-peach-500"
            >
              📍 {r}
            </a>
          ))}
        </div>
        <p className="text-xs text-cocoa-300">버튼을 누르면 네이버 지도 검색이 새 탭으로 열려요.</p>
      </section>

      <section className="card bg-mint-50 text-sm text-cocoa-500">
        <p className="font-semibold">🐹 병원 가기 전 팁</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-cocoa-400">
          <li>방문 전 전화로 “햄스터(소동물) 진료 가능한가요?”를 꼭 확인하세요. 안 보는 곳이 많아요.</li>
          <li>이동 시 보온이 중요해요. 작은 통에 베딩을 깔고, 겨울엔 손난로를 수건으로 감싸 옆에 둬요.</li>
          <li>증상이 시작된 시점, 먹는 양·변 상태를 메모해 가면 진료가 빨라져요.</li>
          <li>응급(설사·호흡곤란)은 24시간 동물병원에 미리 전화하고 출발하세요.</li>
        </ul>
      </section>
    </div>
  );
}
