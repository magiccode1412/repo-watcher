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
 * 将单个仓库条目（结构化或字符串）解析为标准化对象
 * @param {string|Object} item 仓库条目，字符串如 "owner/repo@branch"，或对象 {repo, branch, note}
 * @param {string} defaultBranch 默认分支
 * @returns {{owner: string, repo: string, branch: string, note: string}|null}
 */
function normalizeEntry(item, defaultBranch) {
  let str, note = '';
  if (typeof item === 'string') {
    str = item.trim();
  } else if (item && typeof item === 'object') {
    str = (item.repo || '').trim();
    note = (item.note || '').trim();
    if (item.branch && (!str.includes('@'))) {
      str = `${str}@${item.branch}`;
    }
  } else {
    return null;
  }
  if (!str) return null;

  const result = parseRepoString(str, defaultBranch);
  if (!result) return null;
  result.note = note;
  return result;
}

/**
 * 规范化仓库列表（兼容旧版字符串与新版结构化数组）
 * 新版数组格式：[{ repo: 'owner/repo', branch: 'main', note: '备注' }]
 * 旧版字符串格式：'owner/repo@branch, owner2/repo2'
 * @param {string|Array|undefined} input 仓库数据
 * @param {string} defaultBranch 默认分支
 * @returns {Array<{owner: string, repo: string, branch: string, note: string}>}
 */
export function normalizeRepos(input, defaultBranch) {
  if (!input) return [];

  let items;
  if (Array.isArray(input)) {
    items = input;
  } else if (typeof input === 'string') {
    const delimiter = input.includes('\n') ? '\n' : ',';
    items = input.split(delimiter).map(s => s.trim()).filter(Boolean);
  } else {
    return [];
  }

  return items
    .map(item => normalizeEntry(item, defaultBranch))
    .filter(Boolean);
}
