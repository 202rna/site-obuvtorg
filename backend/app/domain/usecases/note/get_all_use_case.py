from app.domain.ports import NoteRepositoryPort


class GetAllNotesUseCase:
    """Получение каталога заметок."""
    def __init__(self, note_repo: NoteRepositoryPort):
        self.note_repo = note_repo

    async def execute(self, last_id: int | None = None, limit: int = 6) -> list:
        if limit < 1 or limit > 100:
            limit = 6

        return await self.note_repo.get_all(last_id=last_id, limit=limit)
