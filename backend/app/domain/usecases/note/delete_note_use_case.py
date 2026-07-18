from app.domain.ports import NoteRepositoryPort
import os


class DeleteNoteUseCase:
    def __init__(self, note_repo: NoteRepositoryPort) -> None:
        self.note_repo = note_repo
            
    async def execute(self, user_role: str, id: int) -> bool:
        """Удаляет заметку по ID. С удалением самого изображения
        с сервера в случае если image_url был не Null.

        Args:
            id (int): 

        Returns:
            bool: _description_
        """
        if user_role != "admin":
            raise PermissionError("Доступно только администратору.")
        
        result_del_note = await self.note_repo.delete(id)
        if result_del_note is False:
            return False
        if result_del_note is None:
            return True
        
        if isinstance(result_del_note, str):
            file_path = result_del_note.lstrip("/")
            if os.path.exists(file_path):
                os.remove(file_path)
        return True
