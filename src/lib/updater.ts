/**
 * 版本检测与更新模块
 */

import packageJson from '../../package.json';

// 当前应用版本号（从 package.json 读取）
export const CURRENT_VERSION = packageJson.version || '1.0.0';

/**
 * 远程版本检查地址（发布说明见 文档/GitHub发布更新指南.md）
 *
 * ⚠️ 发布前必须把下面的 shuatibao/app 换成你自己的 GitHub 仓库（用户名/仓库名）。
 * 配置方式二选一：
 *  1) 直接修改下方默认值；
 *  2) 构建时设置环境变量 NEXT_PUBLIC_VERSION_CHECK_URL（会覆盖默认值）。
 */
const GITHUB_OWNER = 'hu141-hu';       // GitHub 用户名
const GITHUB_REPO = 'shuatibao-app';   // GitHub 仓库名

const DEFAULT_VERSION_CHECK_URLS = [
  // 主源：GitHub Raw（国外访问稳定）
  `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/version.json`,
  // 备用源：jsDelivr 镜像 GitHub 文件（国内访问更稳）
  `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/version.json`,
];

const ENV_VERSION_CHECK_URL = process.env.NEXT_PUBLIC_VERSION_CHECK_URL;
const VERSION_CHECK_URLS = ENV_VERSION_CHECK_URL ? [ENV_VERSION_CHECK_URL] : DEFAULT_VERSION_CHECK_URLS;

/** 启动自动检查的最小间隔（毫秒）：6 小时一次，避免每次启动都请求 */
export const AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// localStorage key
const LAST_CHECK_KEY = 'app_last_update_check';
const LAST_PROMPT_KEY = 'app_last_update_prompt';

export interface VersionInfo {
  version: string;        // 语义化版本号 如 "1.1.0"
  versionCode: number;    // 数字版本号
  downloadUrl: string;    // APK 下载地址
  changelog: string;      // 更新说明（\n 分隔）
  forceUpdate: boolean;   // 是否强制更新
}

/**
 * 获取远程版本信息
 */
export async function checkForUpdate(): Promise<VersionInfo | null> {
  // 依次尝试多个检查源（GitHub Raw → jsDelivr 镜像）
  for (const url of VERSION_CHECK_URLS) {
    try {
      const response = await fetch(url, {
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5秒超时
      });
      if (!response.ok) continue;
      const data = await response.json();
      // 基本校验
      if (!data.version || !data.versionCode) continue;
      return data as VersionInfo;
    } catch {
      continue; // 该源失败，尝试下一个
    }
  }
  return null; // 所有源都失败
}

/**
 * 比较语义化版本号，判断 remote 是否比 local 更新
 * @param remoteRemote version string like "1.0.0"
 * @param local Current version string like "1.0.0"
 */
export function isNewerVersion(remote: string, local: string): boolean {
  const parse = (v: string) => v.split('.').map(Number);
  
  const remoteParts = parse(remote);
  const localParts = parse(local);
  
  const maxLength = Math.max(remoteParts.length, localParts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const remoteVal = remoteParts[i] || 0;
    const localVal = localParts[i] || 0;
    
    if (remoteVal > localVal) {
      return true; // 远程版本更高，有更新
    } else if (remoteVal < localVal) {
      return false; // 远程版本更低，无更新
    }
  }
  
  return false; // 版本相同，无更新
}

/**
 * 检查今天是否已经提示过更新（同一天不重复提示）
 */
export function shouldShowPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const lastPrompt = localStorage.getItem(LAST_PROMPT_KEY);
    if (!lastPrompt) return true;
    const today = new Date().toISOString().split('T')[0];
    return lastPrompt !== today;
  } catch {
    return true;
  }
}

/**
 * 记录已提示过更新
 */
export function markPrompted(): void {
  if (typeof window === 'undefined') return;
  try {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LAST_PROMPT_KEY, today);
  } catch { /* ignore */ }
}

/**
 * 记录本次检查时间
 */
export function markChecked(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_CHECK_KEY, new Date().toISOString());
  } catch { /* ignore */ }
}

/**
 * 获取上次检查时间
 */
export function getLastCheckTime(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LAST_CHECK_KEY);
  } catch {
    return null;
  }
}
