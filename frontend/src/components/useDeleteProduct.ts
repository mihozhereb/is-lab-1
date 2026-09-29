import { useCallback } from 'react';
import { productApi } from '../api/endpoints';
import { useDialogs } from '../ui/Dialogs';
import { useNotify } from '../ui/Notifications';

/** Удаление Product с подтверждением в отдельном диалоговом окне. */
export function useDeleteProduct(onDeleted?: (id: number) => void) {
  const { confirm, showError } = useDialogs();
  const notify = useNotify();

  return useCallback(
    async (id: number) => {
      const ok = await confirm({
        title: `Удалить Product #${id}?`,
        body: 'Связанные с ним объекты (координаты, организация, владелец) останутся в системе.',
        confirmText: 'Удалить',
        variant: 'danger',
      });
      if (!ok) {
        return;
      }
      try {
        await productApi.remove(id);
        notify.success(`Product #${id} удалён`);
        onDeleted?.(id);
      } catch (error) {
        showError({ title: 'Удаление не выполнено', body: error instanceof Error ? error.message : String(error) });
      }
    },
    [confirm, showError, notify, onDeleted],
  );
}
