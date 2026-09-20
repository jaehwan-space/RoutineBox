export const THEME_STORAGE_KEY = "rb-theme";

/** 첫 페인트 전에 실행되는 인라인 스크립트. 저장된 선택값을 <html data-theme> 에 반영해 깜빡임을 막는다. */
export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");if(s==="light"||s==="dark"){document.documentElement.dataset.theme=s;}else{document.documentElement.removeAttribute("data-theme");}}catch(e){}})();`;
