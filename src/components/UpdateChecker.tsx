'use client';

import { useEffect, useState } from 'react';
import UpdateModal from '@/components/UpdateModal';
import {
  checkForUpdate,
  isNewerVersion,
  CURRENT_VERSION,
  markChecked,
  markPrompted,
  shouldShowPrompt,
  getLastCheckTime,
  AUTO_CHECK_INTERVAL_MS,
  VersionInfo,
} from '@/lib/updater';

/**
 * 启动静默检查更新：
 * - 距上次检查不足 6 小时则跳过（AUTO_CHECK_INTERVAL_MS）
 * - 有新版且当天未提示过才弹窗
 * - 所有失败静默忽略，不影响使用
 */
export default function UpdateChecker() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        // 限频：距上次检查不足 6 小时不再请求
        const last = getLastCheckTime();
        if (last) {
          const elapsed = Date.now() - new Date(last).getTime();
          if (!Number.isNaN(elapsed) && elapsed < AUTO_CHECK_INTERVAL_MS) return;
        }

        const info = await checkForUpdate();
        markChecked();

        if (cancelled || !info) return;
        if (isNewerVersion(info.version, CURRENT_VERSION) && shouldShowPrompt()) {
          markPrompted(); // 当天只提示一次
          setVersionInfo(info);
          setShow(true);
        }
      } catch {
        // 静默失败
      }
    };

    // 延迟 1.5s 执行，避免与首屏渲染争抢资源
    const timer: ReturnType<typeof setTimeout> = setTimeout(run, 1500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!versionInfo) return null;
  return (
    <UpdateModal
      isOpen={show}
      versionInfo={versionInfo}
      onClose={() => setShow(false)}
    />
  );
}
