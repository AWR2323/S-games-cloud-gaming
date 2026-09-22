import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface PasswordGateScreenProps {
  onUnlock: () => void;
  onToggleCloak?: () => void;
}

const CORRECT_PASSWORD = '1013';

export const PasswordGateScreen: React.FC<PasswordGateScreenProps> = ({
  onUnlock,
  onToggleCloak,
}) => {
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForgotNotice, setShowForgotNotice] = useState<boolean>(false);
  const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<{ name: string; email: string; initial: string }>({
    name: 'Student Account',
    email: 's.music.mawa@gmail.com',
    initial: 'S',
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Emergency Esc shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onToggleCloak) {
        e.preventDefault();
        onToggleCloak();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleCloak]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowForgotNotice(false);

    if (!password) {
      setErrorMsg('パスワードを入力してください');
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    // Realistic Google server validation latency
    setTimeout(() => {
      if (password === CORRECT_PASSWORD) {
        sessionStorage.setItem('sgames_unlocked_session', 'true');
        onUnlock();
      } else {
        setIsLoading(false);
        setErrorMsg('パスワードが正しくありません。もう一度お試しいただくか、[パスワードをお忘れの場合] をクリックして再設定してください。');
        inputRef.current?.select();
      }
    }, 420);
  };

  const isLabelFloating = isFocused || password.length > 0;

  return (
    <div className="min-h-screen w-full bg-[#f0f4f9] flex flex-col justify-between google-font text-[#1f1f1f] antialiased select-none">
      {/* Top spacing */}
      <div className="h-4 sm:h-10" />

      {/* Main Google Modern M3 Sign-In Card (1040px Split Screen on Desktop, 448px on Mobile) */}
      <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6">
        <div className="bg-white sm:border sm:border-[#dadce0] rounded-[28px] p-8 sm:p-10 md:p-12 shadow-none sm:shadow-[0_1px_3px_0_rgba(60,64,67,0.08)] relative overflow-hidden transition-all">
          {/* Authentic Google Material Indeterminate Linear Progress Bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#e8f0fe] overflow-hidden rounded-t-[28px]">
              <div className="h-full bg-[#0b57d0] animate-[indeterminate_1.2s_infinite_linear]" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-start">
            {/* Left Column: Google 4-Color Logo & Greeting */}
            <div className="flex flex-col items-start">
              {/* Official Google 4-Color "G" SVG (Modern Google Identity) */}
              <div className="mb-4">
                <svg className="h-10 w-10" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                  <path fill="none" d="M0 0h48v48H0z" />
                </svg>
              </div>

              <h1 className="text-[32px] sm:text-[36px] font-normal text-[#1f1f1f] leading-tight tracking-normal">
                ログイン
              </h1>

              <div className="flex items-center gap-2 mt-3">
                <p className="text-base text-[#1f1f1f]">
                  Google Classroom に進む
                </p>
                <img
                  src="https://ssl.gstatic.com/classroom/favicon.png"
                  alt="Classroom"
                  className="h-4 w-4 object-contain inline-block"
                />
              </div>
            </div>

            {/* Right Column: Account Pill, Floating Password Input & Action Buttons */}
            <div className="flex flex-col w-full max-w-[400px]">
              {/* Account Chip / Pill with Dropdown */}
              <div className="relative mb-8">
                <button
                  type="button"
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="group inline-flex items-center gap-2.5 rounded-full border border-[#747775]/50 bg-white hover:bg-[#f8fafd] px-3.5 py-1.5 transition-colors cursor-pointer text-left"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a73e8] text-[11px] font-semibold text-white">
                    {currentAccount.initial}
                  </div>
                  <span className="text-sm font-medium text-[#1f1f1f]">
                    {currentAccount.email}
                  </span>
                  <ChevronDown className="h-4 w-4 text-[#444746] group-hover:text-[#1f1f1f] transition-transform" />
                </button>

                {/* Account Switcher Dropdown */}
                {showAccountMenu && (
                  <div className="absolute top-11 left-0 z-30 w-72 rounded-2xl border border-[#dadce0] bg-white p-2 shadow-xl animate-fadeIn">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentAccount({
                          name: 'Google Account',
                          email: 's.music.mawa@gmail.com',
                          initial: 'S',
                        });
                        setShowAccountMenu(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f0f4f9] transition-colors text-left"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a73e8] text-xs font-semibold text-white">
                        S
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-xs font-semibold text-[#1f1f1f]">s.music.mawa@gmail.com</div>
                        <div className="text-[11px] text-[#444746]">既定のアカウント</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentAccount({
                          name: 'School Student',
                          email: 'student@school.ed.jp',
                          initial: '学',
                        });
                        setShowAccountMenu(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f0f4f9] transition-colors text-left"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0d652d] text-xs font-semibold text-white">
                        学
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-xs font-semibold text-[#1f1f1f]">student@school.ed.jp</div>
                        <div className="text-[11px] text-[#444746]">学校専用 G Suite</div>
                      </div>
                    </button>

                    <div className="my-1 border-t border-[#dadce0]" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountMenu(false);
                        setErrorMsg('別のアカウントのログインは現在学校ネットワークにより保護されています。');
                      }}
                      className="w-full text-left p-2.5 text-xs text-[#0b57d0] hover:bg-[#0b57d0]/10 rounded-xl font-medium"
                    >
                      別のアカウントを使用
                    </button>
                  </div>
                )}
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Google Material 3 Outlined Text Field with Floating Notch Label */}
                <div className="relative">
                  <div
                    className={`relative rounded-[4px] transition-colors ${
                      errorMsg
                        ? 'border-2 border-[#b3261e]'
                        : isFocused
                        ? 'border-2 border-[#0b57d0]'
                        : 'border border-[#747775] hover:border-[#1f1f1f]'
                    }`}
                  >
                    {/* Floating Label with White Mask Notch */}
                    <label
                      htmlFor="google-login-password"
                      className={`absolute pointer-events-none transition-all duration-150 ease-out select-none ${
                        isLabelFloating
                          ? `-top-2.5 left-3 bg-white px-1.5 text-xs font-normal ${
                              errorMsg ? 'text-[#b3261e]' : isFocused ? 'text-[#0b57d0]' : 'text-[#444746]'
                            }`
                          : 'top-4 left-4 text-base text-[#444746]'
                      }`}
                    >
                      パスワードを入力
                    </label>

                    <input
                      id="google-login-password"
                      ref={inputRef}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className="w-full bg-transparent px-4 py-3.5 text-base text-[#1f1f1f] focus:outline-none"
                    />
                  </div>

                  {/* Material Error Icon & Description */}
                  {errorMsg && (
                    <div className="mt-1.5 flex items-start gap-2 text-xs text-[#b3261e] leading-snug animate-fadeIn">
                      {/* Exact Google Red Alert Circle SVG */}
                      <svg
                        className="h-4 w-4 flex-shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="#b3261e"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                {/* Show Password Checkbox (Material Styled) */}
                <div className="flex items-center gap-3 pt-1">
                  <label className="relative flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="google-show-password-cb"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="h-[18px] w-[18px] rounded-[2px] border-2 border-[#747775] peer-checked:border-[#0b57d0] peer-checked:bg-[#0b57d0] flex items-center justify-center transition-colors">
                      {showPassword && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                    </div>
                    <span className="text-sm text-[#1f1f1f]">パスワードを表示</span>
                  </label>
                </div>

                {/* Forgot Password Link */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotNotice(true)}
                    className="text-sm font-medium text-[#0b57d0] hover:text-[#0842a0] hover:underline cursor-pointer focus:outline-none"
                  >
                    パスワードをお忘れの場合
                  </button>
                </div>

                {/* Educational / Workspace Notice Dialog */}
                {showForgotNotice && (
                  <div className="rounded-xl bg-[#f8fafd] border border-[#dadce0] p-4 text-xs text-[#444746] animate-fadeIn space-y-2">
                    <div className="font-semibold text-[#1f1f1f] flex items-center gap-1.5">
                      <img
                        src="https://ssl.gstatic.com/classroom/favicon.png"
                        alt="Classroom"
                        className="h-3.5 w-3.5"
                      />
                      <span>Google Workspace for Education</span>
                    </div>
                    <p className="leading-relaxed">
                      学校または組織のアカウントのパスワードをお忘れの場合は、担当の教員または教育情報管理者にお問い合わせください。
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowForgotNotice(false)}
                      className="text-[#0b57d0] font-medium hover:underline cursor-pointer"
                    >
                      閉じる
                    </button>
                  </div>
                )}

                {/* Bottom Row Actions */}
                <div className="flex items-center justify-between pt-8 sm:pt-10">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('別のアカウントの切り替えは現在管理者に制限されています。');
                    }}
                    className="text-sm font-medium text-[#0b57d0] hover:bg-[#0b57d0]/[0.08] px-3 py-2 rounded-full transition-colors cursor-pointer"
                  >
                    別のアカウントを使用
                  </button>

                  <button
                    id="google-signin-next-btn"
                    type="submit"
                    disabled={isLoading}
                    className="rounded-full bg-[#0b57d0] hover:bg-[#0842a0] active:bg-[#063277] text-white px-6 py-2.5 text-sm font-medium transition-all shadow-none hover:shadow-sm cursor-pointer disabled:opacity-60 select-none min-w-[80px]"
                  >
                    {isLoading ? '確認中...' : '次へ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer (Language Selector, Help, Privacy, Terms) */}
      <div className="w-full max-w-[1040px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between text-xs text-[#444746]">
        <div className="flex items-center gap-1.5 cursor-pointer hover:bg-black/5 px-2 py-1 rounded transition-colors">
          <span>日本語</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#444746]" />
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://support.google.com/edu/classroom"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-[#1f1f1f]"
          >
            ヘルプ
          </a>
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-[#1f1f1f]"
          >
            プライバシー
          </a>
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-[#1f1f1f]"
          >
            利用規約
          </a>
        </div>
      </div>
    </div>
  );
};
