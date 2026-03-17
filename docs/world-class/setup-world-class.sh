#!/bin/bash
# PRIVOD World-Class: Создание структуры папок
# Запусти из корня проекта: bash setup-world-class.sh

echo "Создаю структуру docs/world-class/..."

mkdir -p docs/world-class/phase1-audit
mkdir -p docs/world-class/phase2-plan
mkdir -p docs/world-class/phase3-execution

# Скопируй 00-INDEX.md и 01-GOLD-STANDARD.md в docs/world-class/ вручную

# Создаю накопительные файлы
cat > docs/world-class/BUGS.md << 'EOF'
# Найденные баги

> Этот файл обновляется КАЖДОЙ аудит-сессией Claude Code.
> Формат: [ПРИОРИТЕТ] [ТЕГ] Описание | Файл:строка

## P1 — Critical (система ломается или теряет данные)

## P2 — High (функционал не работает как должен)

## P3 — Medium (работает, но плохо)

## P4 — Low (мелочи, косметика)
EOF

cat > docs/world-class/IMPROVEMENTS.md << 'EOF'
# Предложения по улучшению

> Этот файл обновляется КАЖДОЙ сессией Claude Code.
> Формат: [ПРИОРИТЕТ] [ТЕГ] Описание

## Must Have (без этого не продашь)

## Should Have (конкурентное преимущество)

## Nice to Have (полировка)
EOF

cat > docs/world-class/COMPETITORS.md << 'EOF'
# Анализ конкурентов

> Заполняется сессией 1.Y (анализ конкурентов)
EOF

echo "Готово! Теперь:"
echo "1. Скопируй GOLD_STANDARD_CONSTRUCTION_ERP.md → docs/world-class/01-GOLD-STANDARD.md"
echo "2. Скопируй 00-INDEX.md → docs/world-class/00-INDEX.md"
echo "3. Запускай первый промпт (1.0) из CLAUDE_CODE_MASTER_GUIDE.md"
