/**
 * 版本检测与更新模块
 */

import packageJson from '../../package.json';

// 当前应用版本号（从 package.json 读取）
export const CURRENT_VERSION = packageJson.version || '1.0.0';
export const CURRENT_VERSION_CODE = parseInt(packageJson.version?.replace(/\./g, '') || '100');

// 远程版本配置 URL (环境变量中配置)
const VERSION_CHECK_URL = process.env.NEXT_PUBLIC_VERSION_CHECK_URL || 
  'https://raw.githubusercontent.com/shuatibao/app/main/version.json';

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
  try {
    const response = await fetch(VERSION_CHECK_URL, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000), // 5秒超时
    });
    if (!response.ok) return null;
    const data = await response.json();
    // 基本校验
    if (!data.version || !data.versionCode) return null;
    return data as VersionInfo;
  } catch {
    return null; // 网络错误时静默失败
  }
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
