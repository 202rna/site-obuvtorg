from app.domain.ports import NoteRepositoryPort
from fastapi import HTTPException, status


class GetOneNoteByIdUseCase:
    """Получение каталога заметок."""
    def __init__(self, note_repo: NoteRepositoryPort):
        self.note_repo = note_repo

    async def execute(self, note_id: int) -> dict:
        if note_id < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Идентификатор заметки должен быть положительным числом."
            )
        return await self.note_repo.get_one(note_id=note_id)
