/**
 * 解析单个仓库字符串（格式：owner/repo 或 owner/repo@branch）
 * @param {string} repoStr 单个仓库字符串
 * @param {string} defaultBranch 默认分支
 * @returns {{owner: string, repo: string, branch: string}|null}
 */
export function parseRepoString(repoStr, defaultBranch) {
  const parts = repoStr.split('@');
  const repoParts = parts[0].split('/');

  if (repoParts.length !== 2) return null;

  return {
    owner: repoParts[0].trim(),
    repo: repoParts[1].trim(),
    branch: parts.length > 1 ? parts[1].trim() : defaultBranch
  };
}

/**
 * 解析仓库列表字符串（支持逗号或换行分隔）
 * @param {string} repoStr 仓库列表字符串
 * @param {string} defaultBranch 默认分支
 * @returns {Array<{owner: string, repo: string, branch: string}>}
 */
export function parseRepoList(repoStr, defaultBranch) {
  if (!repoStr) return [];

  // 支持逗号或换行分隔
  const delimiter = repoStr.includes('\n') ? '\n' : ',';

  return repoStr.split(delimiter)
    .map(repo => repo.trim())
    .filter(repo => repo)
    .map(repo => parseRepoString(repo, defaultBranch))
    .filter(repo => repo !== null);
}

/**
 * 解析单个 CNB 仓库字符串（格式：owner/repo 或 owner/repo@branch）
 * @param {string} repoStr 单个 CNB 仓库字符串
 * @param {string} defaultBranch 默认分支
 * @returns {{owner: string, repo: string, branch: string}|null}
 */
export function parseCnbRepoString(repoStr, defaultBranch) {
  const parts = repoStr.split('@');
  const repoParts = parts[0].split('/');

  if (repoParts.length !== 2) return null;

  return {
    owner: repoParts[0].trim(),
    repo: repoParts[1].trim(),
    branch: parts.length > 1 ? parts[1].trim() : defaultBranch
  };
}

/**
 * 解析 CNB 仓库列表字符串（支持逗号或换行分隔）
 * @param {string} repoStr CNB 仓库列表字符串
 * @param {string} defaultBranch 默认分支
 * @returns {Array<{owner: string, repo: string, branch: string}>}
 */
export function parseCnbRepoList(repoStr, defaultBranch) {
  if (!repoStr) return [];

  // 支持逗号或换行分隔
  const delimiter = repoStr.includes('\n') ? '\n' : ',';

  return repoStr.split(delimiter)
    .map(repo => repo.trim())
    .filter(repo => repo)
    .map(repo => parseCnbRepoString(repo, defaultBranch))
    .filter(repo => repo !== null);
}
