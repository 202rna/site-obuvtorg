import os
from app.domain.ports import NoteRepositoryPort


class UpdateNoteUseCase:
    def __init__(self, note_repo: NoteRepositoryPort) -> None:
        self.note_rep = note_repo
        
    async def execute(self, user_role: str, id: int, field_to_update: dict) -> bool:
        """Частичное обновление заметки по переданным полям.
        Удаляет изображение с сервера в случае возврата строки.

        Args:
            id (int): ID изменяемой Note.
            field_to_update (dict): Обновленные пользователем поля.

        Returns:
            bool: Если нашли строку и изменили - True, иначе - False.
        """
        if user_role != "admin":
            raise PermissionError("Доступно только администратору.")
        if not field_to_update:
            return True
        
        exec_update_note = await self.note_rep.update(id, **field_to_update)
        if exec_update_note is False:
            return False
        if exec_update_note is None:
            return True

        if isinstance(exec_update_note, str):
            file_path = exec_update_note.lstrip("/")
            if os.path.exists(file_path):
                os.remove(file_path)
                
        return True
