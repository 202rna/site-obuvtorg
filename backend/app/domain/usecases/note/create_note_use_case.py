from app.domain.ports import NoteRepositoryPort


class CreateNoteUseCase:
    def __init__(self, note_repo: NoteRepositoryPort) -> None:
        self.note_repo =  note_repo
    
    async def execute(self, user_role: str, title: str, description: str, image_url: str | None) -> bool:
        if user_role != "admin":
            raise PermissionError("Доступно только администратору.")
        return await self.note_repo.add(title, description, image_url)
