# Adopted Changes (Current Integration Snapshot)

## A. Local-first publishing flow
- Replaced proxy token dependency with direct WeChat stable token API.
- Removed mandatory AuthKey/member gating from main WeChat workflow.
- Kept copy + draft publishing path available for local usage.

## B. WeChat-focused MVP UX
- Preview currently focuses on WeChat tab only.
- Keeps MVP scope clear: preview -> copy OR preview -> sync to draft.

## C. Theme integration
- Added Raphael theme set into runtime theme loading.
- Merged default themes + integrated themes in assets manager.

## D. Pre-experiment hardening
- Added multi-device preview modes: mobile / tablet / desktop.
- Added AppSecret masking and safe save behavior in settings.
- Added short-lived token cache to reduce repeated token requests.

## E. Operations docs
- Added experiment runbook for Obsidian local deployment and regression checks.

## Known remaining issues
- Some copy/paste rendering differences still exist in WeChat editor.
- Need focused iteration on list/code-block paste fidelity.
