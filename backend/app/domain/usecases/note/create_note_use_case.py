from app.domain.ports import NoteRepositoryPort
from datetime import datetime, timezone


class CreateNoteUseCase:
    def __init__(self, note_repo: NoteRepositoryPort) -> None:
        self.note_repo =  note_repo
    
    async def execute(self, user_role: str, title: str, description: str, image_url: str | None) -> bool:
        if user_role != "admin":
            raise PermissionError("Доступно только администратору.")
        current_time = datetime.now(timezone.utc)
        return await self.note_repo.add(current_time, title, description, image_url)
