import React, { useState } from 'react';
import {
  Home,
  Calendar,
  CheckSquare,
  Archive,
  Settings,
  Gamepad2,
  Menu,
  MoreHorizontal,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ClassroomCloakProps {
  onExitCloak: () => void;
}

export const ClassroomCloak: React.FC<ClassroomCloakProps> = ({ onExitCloak }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen w-full bg-[#ffffff] text-[#1f1f1f] font-sans antialiased select-none pb-24">
      {/* Exact Google Classroom Header matching the image */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-white px-4 sm:px-6">
        {/* Left: Hamburger (三本線) & Google Classroom wordmark */}
        <div className="flex items-center gap-4">
          <button
            id="classroom-hamburger-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] active:bg-[#e8eaed] transition-colors cursor-pointer"
            title="メインメニュー"
            aria-label="メインメニュー"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-[22px] font-medium tracking-tight text-[#444746] flex items-center gap-1.5">
              <span className="font-semibold text-[#1f1f1f]">Google</span>
              <span>Classroom</span>
            </span>
          </div>
        </div>

        {/* Right: Green Profile Avatar 'S' & More options ••• matching the image */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00796b] text-white font-medium text-sm shadow-xs cursor-pointer"
            title="Google アカウント (s.music.mawa@gmail.com)"
          >
            S
          </div>

          <button
            id="classroom-header-more-btn"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
            title="その他のオプション"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Slide-out Sidebar Drawer when user clicks Hamburger (左上の三本線) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative z-50 flex h-full w-76 sm:w-84 flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="flex h-16 items-center gap-4 border-b border-[#e0e2ec] px-4">
              <button
                id="close-sidebar-drawer-btn"
                onClick={() => setIsSidebarOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#444746] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                title="メニューを閉じる"
              >
                <Menu className="h-6 w-6" />
              </button>

              <span className="text-[20px] font-medium text-[#444746] tracking-tight">
                <span className="font-semibold text-[#1f1f1f]">Google</span> Classroom
              </span>
            </div>

            {/* Sidebar Menu Items */}
            <div className="flex-1 overflow-y-auto py-3">
              {/* PRIMARY RETURN TO S GAMES BUTTON (As requested by user!) */}
              <div className="px-3 pb-3 mb-2 border-b border-[#e0e2ec]">
                <button
                  id="drawer-return-to-sgames-btn"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    onExitCloak();
                  }}
                  className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-3 text-white shadow-md shadow-violet-600/25 hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer group"
                  title="S games クラウドゲームに戻る"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
                      <Gamepad2 className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold leading-tight flex items-center gap-1">
                        <span>S games に戻る</span>
                        <Sparkles className="h-3 w-3 text-amber-300" />
                      </div>
                      <div className="text-[10px] text-violet-200">ゲーム画面を再開</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Standard Authentic Classroom Navigation Links */}
              <div className="space-y-0.5 px-2">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center gap-4 rounded-r-full bg-[#c2e7ff] px-4 py-3 text-[#001d35] transition-colors cursor-pointer"
                >
                  <Home className="h-5 w-5 text-[#001d35]" />
                  <span className="text-sm font-semibold">ホーム</span>
                </button>

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center gap-4 rounded-r-full px-4 py-3 text-[#444746] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                >
                  <Calendar className="h-5 w-5 text-[#444746]" />
                  <span className="text-sm font-medium">カレンダー</span>
                </button>
              </div>

              <div className="my-2 border-t border-[#e0e2ec]" />

              {/* Enrolled Section */}
              <div className="px-5 py-1.5 text-[11px] font-semibold text-[#444746] uppercase tracking-wider">
                登録中
              </div>

              <div className="space-y-0.5 px-2">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center gap-4 rounded-r-full px-4 py-2.5 text-[#444746] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                >
                  <CheckSquare className="h-5 w-5 text-[#444746]" />
                  <span className="text-sm font-medium">ToDo リスト</span>
                </button>

                {/* Class items matching user image */}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center gap-3.5 rounded-r-full px-4 py-2.5 text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#283038] text-white text-xs font-bold">
                    D
                  </div>
                  <div className="truncate text-left">
                    <p className="text-sm font-medium truncate text-[#1f1f1f]">D1</p>
                    <p className="text-[11px] text-[#444746] truncate">クラスルーム管理者</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center gap-3.5 rounded-r-full px-4 py-2.5 text-[#1f1f1f] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006097] text-white text-xs font-bold">
                    5
                  </div>
                  <div className="truncate text-left">
                    <p className="text-sm font-medium truncate text-[#1f1f1f]">5-4 学級活動【2026 所沢小】</p>
                    <p className="text-[11px] text-[#444746] truncate">クラスルーム管理者</p>
                  </div>
                </button>
              </div>

              <div className="my-2 border-t border-[#e0e2ec]" />

              <div className="space-y-0.5 px-2">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center gap-4 rounded-r-full px-4 py-2.5 text-[#444746] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                >
                  <Archive className="h-5 w-5 text-[#444746]" />
                  <span className="text-sm font-medium">アーカイブされたクラス</span>
                </button>

                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex w-full items-center gap-4 rounded-r-full px-4 py-2.5 text-[#444746] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
                >
                  <Settings className="h-5 w-5 text-[#444746]" />
                  <span className="text-sm font-medium">設定</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container matching user screenshot */}
      <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6 space-y-4">
        {/* Card 1: 期限間近 (Upcoming Card) */}
        <div className="w-full rounded-2xl border border-[#c4c7c5] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-normal text-[#1f1f1f] tracking-tight">期限間近</h2>
            <button
              id="upcoming-todo-link"
              className="text-sm font-medium text-[#0b57d0] hover:text-[#0842a0] hover:underline transition-colors cursor-pointer"
            >
              ToDo リストを表示
            </button>
          </div>
          <p className="mt-4 text-xs sm:text-sm text-[#444746]">
            すぐに提出が必要な課題はありません
          </p>
        </div>

        {/* Card 2: D1 (Dark/Black graphic banner matching screenshot) */}
        <div className="group relative w-full overflow-hidden rounded-2xl bg-[#232930] shadow-sm transition-shadow hover:shadow-md cursor-pointer">
          {/* Background Illustration Artwork on the right side */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Dark gradient base */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#20262e] via-[#262f38] to-[#343e49]" />

            {/* Simulated classroom medal / coins / notebook artwork matching screenshot */}
            <div className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/3 opacity-85">
              <svg className="h-full w-full object-cover" viewBox="0 0 300 140" fill="none" preserveAspectRatio="none">
                {/* Diagonal stripes & shapes */}
                <path d="M120 0 L240 140 L300 140 L180 0 Z" fill="#1b2128" />
                <path d="M180 0 L280 140 L300 140 L200 0 Z" fill="#3e4854" />
                <path d="M160 80 L300 140 L250 140 Z" fill="#d97706" opacity="0.6" />
                {/* Gold coin / medal badge */}
                <circle cx="210" cy="110" r="45" fill="#f59e0b" opacity="0.8" />
                <circle cx="210" cy="110" r="38" fill="#fbbf24" opacity="0.9" />
                <circle cx="210" cy="110" r="30" stroke="#f59e0b" strokeWidth="3" fill="none" />
                <circle cx="175" cy="85" r="32" fill="#d97706" opacity="0.4" />
                <circle cx="175" cy="125" r="5" fill="#fcd34d" />
              </svg>
            </div>
          </div>

          {/* Banner Content */}
          <div className="relative z-10 flex min-h-[135px] sm:min-h-[145px] flex-col justify-between p-5 text-white">
            <div className="flex items-start justify-between">
              <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-white group-hover:underline">
                D1
              </h3>

              <button
                id="card-d1-more-btn"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
                title="その他のオプション"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-white/85 font-light tracking-wide">
              クラスルーム管理者
            </p>
          </div>
        </div>

        {/* Card 3: 5-4 学級活動【2026 所沢小】 (Blue stationary banner matching screenshot) */}
        <div className="group relative w-full overflow-hidden rounded-2xl bg-[#006097] shadow-sm transition-shadow hover:shadow-md cursor-pointer">
          {/* Background Illustration Artwork on the right side */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Ocean Blue gradient base */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#005182] via-[#006097] to-[#0277bd]" />

            {/* Stationery stationery illustration (notebook, pen, ruler) matching screenshot */}
            <div className="absolute right-0 top-0 bottom-0 w-1/2 sm:w-2/5 opacity-90">
              <svg className="h-full w-full object-cover" viewBox="0 0 350 140" fill="none" preserveAspectRatio="none">
                {/* Notebook spine & cover */}
                <g transform="rotate(-22 240 70)">
                  {/* Notebook shadow */}
                  <rect x="180" y="-10" width="130" height="150" rx="12" fill="#003e66" opacity="0.5" />
                  {/* Green notebook cover */}
                  <rect x="175" y="-15" width="125" height="145" rx="12" fill="#4caf50" />
                  {/* Spine ribbon / inner lines */}
                  <rect x="195" y="10" width="8" height="60" rx="4" fill="#a5d6a7" />
                  <rect x="215" y="10" width="8" height="60" rx="4" fill="#a5d6a7" />
                  <rect x="175" y="-15" width="22" height="145" rx="6" fill="#388e3c" />
                </g>
                {/* Pen / Stylus */}
                <g transform="rotate(35 150 40)">
                  <rect x="130" y="20" width="12" height="100" rx="5" fill="#8d6e63" />
                  <polygon points="130,20 142,20 136,5" fill="#d7ccc8" />
                  <rect x="132" y="30" width="8" height="20" rx="2" fill="#5d4037" />
                </g>
                {/* Ruler in background */}
                <g transform="rotate(-55 280 40)">
                  <rect x="250" y="0" width="30" height="180" rx="4" fill="#b0bec5" opacity="0.7" />
                  <line x1="250" y1="20" x2="265" y2="20" stroke="#78909c" strokeWidth="2" />
                  <line x1="250" y1="40" x2="265" y2="40" stroke="#78909c" strokeWidth="2" />
                  <line x1="250" y1="60" x2="265" y2="60" stroke="#78909c" strokeWidth="2" />
                </g>
              </svg>
            </div>
          </div>

          {/* Banner Content */}
          <div className="relative z-10 flex min-h-[135px] sm:min-h-[145px] flex-col justify-between p-5 text-white">
            <div className="flex items-start justify-between">
              <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-white group-hover:underline">
                5-4 学級活動【2026 所沢小】
              </h3>

              <button
                id="card-54-more-btn"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors cursor-pointer"
                title="その他のオプション"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-white/85 font-light tracking-wide">
              クラスルーム管理者
            </p>
          </div>
        </div>
      </main>

      {/* Floating Action Button '+' on bottom right matching the screenshot */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          id="classroom-fab-plus-btn"
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d3e3fd] text-[#041e49] shadow-lg shadow-[#041e49]/15 hover:shadow-xl hover:bg-[#c2e7ff] active:scale-95 transition-all cursor-pointer"
          title="クラスに参加"
        >
          <Plus className="h-7 w-7 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};
