'use client';

import { VersionInfo } from '@/lib/updater';

interface UpdateModalProps {
  isOpen: boolean;
  versionInfo: VersionInfo;
}

export default function UpdateModal({ isOpen, versionInfo }: UpdateModalProps) {
  if (!isOpen) return null;

  const handleUpdate = () => {
    if (versionInfo.downloadUrl) {
      // 尝试使用 Capacitor Browser 打开
      import('@capacitor/browser').then(({ Browser }) => {
        Browser.open({ url: versionInfo.downloadUrl });
      }).catch(() => {
        // 降级使用 window.open
        window.open(versionInfo.downloadUrl, '_blank');
      });
    }
  };

  const changelogLines = versionInfo.changelog
    ? versionInfo.changelog.split('\n').filter(line => line.trim())
    : [];
  
  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4"
        onClick={versionInfo.forceUpdate ? undefined : () => {}}
      />

      {/* 卡片 */}
      <div className="fixed left-1/2 top-1/2 z-[61] max-w-sm -translate-x-1/2 -translate-y-1/2 w-full">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4">
          {/* 标题 */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            发现新版本 v{versionInfo.version}
          </h2>
          
          {/* 更新日期和更新日志 */}
          <div className="space-y-2">
            {changelogLines.map((line, index) => (
              <p key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-3 pt-2">
            {!versionInfo.forceUpdate && (
              <button
                onClick={() => {}}
                className="flex-1 px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                稍后提醒
              </button>
            )}
            <button
              onClick={handleUpdate}
              className="flex-1 px-4 py-2.5 text-white bg-[#10B981] rounded-lg hover:bg-[#059669] transition-colors font-medium"
            >
              立即更新
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
