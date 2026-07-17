from app.domain.ports import NoteRepositoryPort


class CreateNoteUseCase:
    def __init__(self, note_repo: NoteRepositoryPort) -> None:
        self.note_repo =  note_repo
    
    async def execute(self, title: str, description: str, image_url: str | None) -> bool:
        exec_add = await self.note_repo.add(title, description, image_url)
        return exec_add
