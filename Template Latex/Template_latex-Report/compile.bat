@echo off
chcp 65001 >nul
echo =======================================================
echo   DANG BIEN DICH BAO CAO LATEX VOI XELATEX VA BIBTEX
echo =======================================================
echo.
echo * Luu y: Neu ban dang mo file main.pdf, vui long dong lai de he thong ghi de.
echo.

cd /d "%~dp0"

echo [1/4] Bien dich lan 1 (Tao file phu tro)...
xelatex -interaction=nonstopmode -c-style-errors main.tex

echo.
echo [2/4] Xu ly tai lieu tham khao IEEE voi BibTeX...
bibtex main

echo.
echo [3/4] Bien dich lan 2 (Cap nhat trich dan va chi muc)...
xelatex -interaction=nonstopmode -c-style-errors main.tex

echo.
echo [4/4] Bien dich lan 3 (Chot so trang va lien ket cheo)...
xelatex -interaction=nonstopmode -c-style-errors main.tex

if exist main.pdf (
    echo.
    echo =======================================================
    echo   THANH CONG! Tep PDF da duoc tao tai: main.pdf
    echo =======================================================
    start main.pdf
) else (
    echo.
    echo [LOI] Khong the tao tep main.pdf. Vui long dong file PDF dang mo roi thu lai!
)

pause
