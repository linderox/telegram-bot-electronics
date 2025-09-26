export default function stripHtmlTags(html: string): string {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    return tempDiv.textContent || tempDiv.innerText || '';
}