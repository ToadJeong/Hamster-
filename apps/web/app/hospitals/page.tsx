import { HospitalSearch } from '@/components/HospitalSearch';
import { getLocale } from '@/lib/i18n-server';
import { makeT } from '@/lib/i18n';

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산',
  '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function HospitalsPage() {
  const t = makeT(getLocale());
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-cocoa-500 sm:text-3xl">{t('hospitals.title')}</h1>
        <p className="mt-1 text-sm text-cocoa-300">
          {t('hospitals.subtitle')}
        </p>
      </header>

      <HospitalSearch />

      <section className="space-y-3">
        <h2 className="font-semibold text-cocoa-500">{t('hospitals.byRegion')}</h2>
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
        <p className="text-xs text-cocoa-300">{t('hospitals.naverNote')}</p>
      </section>

      <section className="card bg-mint-50 text-sm text-cocoa-500">
        <p className="font-semibold">{t('hospitals.tipsTitle')}</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-cocoa-400">
          <li><strong>‘소동물·이그조틱(exotic) 진료’ 가능 여부를 전화로 먼저 확인하세요.</strong> 개·고양이만 보는 곳이 대부분이라, 햄스터를 진료한 경험이 있는지까지 물어보면 좋아요.</li>
          <li><strong>이동 시 보온이 가장 중요해요.</strong> 작은 통에 평소 쓰던 베딩을 깔고(익숙한 냄새가 안정에 도움), 겨울엔 손난로를 수건으로 감싸 통 한쪽에 둬요. 한쪽만 따뜻하게 해 더우면 피할 수 있게 합니다.</li>
          <li><strong>증상 메모를 준비하세요.</strong> 시작 시점, 먹는 양·물 양, 대소변 상태, 체중 변화, 평소와 다른 행동을 적어가면 진단이 빨라져요. 가능하면 증상 <strong>사진·영상</strong>도 찍어 가세요.</li>
          <li><strong>몸무게를 미리 재 가면 좋아요.</strong> 약 용량 계산과 상태 판단의 기준이 됩니다(주방 저울로 충분).</li>
          <li><strong>응급 신호는 지체하지 마세요.</strong> 설사로 엉덩이가 젖는 웻테일, 호흡 곤란·계속되는 쌕쌕거림, 24시간 이상 안 먹음, 한쪽이 붓는 농양/종양, 머리를 기울이거나 한쪽으로 도는 사경(斜頸)은 빠르게 악화돼요.</li>
          <li><strong>가성동면(저체온)으로 굳어 있으면</strong> 손으로 감싸 천천히 체온을 올리며(급가열 금지) 따뜻하게 한 뒤 바로 병원에 연락하세요.</li>
          <li><strong>임의로 약을 주지 마세요.</strong> 사람·강아지 약은 햄스터에게 치명적일 수 있어요. 특히 일부 항생제(페니실린 계열 등)는 장내세균을 망가뜨려 위험합니다.</li>
          <li><strong>진료비·검사 가능 범위를 미리 물어보세요.</strong> 엑스레이·초음파가 어려운 곳도 있어, 가능한 검사를 확인해 두면 동선을 줄일 수 있어요.</li>
          <li><strong>합사 중이었다면 아픈 개체를 즉시 분리</strong>해서 데려가세요(감염 전파·공격 방지). 평소 환경(베딩·사료 종류)도 알려주면 진단에 도움이 됩니다.</li>
        </ul>
      </section>
    </div>
  );
}
