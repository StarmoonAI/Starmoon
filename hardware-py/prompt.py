
from dataclasses import dataclass
from supabase import Client

@dataclass
class Prompt:
    """Prompt for a chat client."""

    user: dict
    toy: dict
    chat_group_id: str
    supabase: Client

    @classmethod
    def new(cls, *, supabase: Client, toy: dict, user: dict, chat_group_id: str) -> "Prompt":
        """Create a new prompt."""
        return cls(toy=toy, supabase=supabase, user=user, chat_group_id=chat_group_id)

    async def construct_prompt(self) -> str:
        print(self.user)
        # Using .get() method to safely access 'modules' key with an empty list as default
        modules = ", ".join(self.user.get('modules', []))

        prompt_template = (
            "YOU ARE: {toy_expanded_prompt}\n\n"
            "YOU ARE TALKING TO:\n"
            "{child_name} who is {child_age} year old. Here is some more information on "
            "{child_name_repeat} set by their parent: {child_persona}. Use a friendly tone and talk to this child as if they are "
            "{child_age_repeat} years old.\n\n"
            "YOUR TOPICS:\n"
            "You must be encouraging and foster a growth mindset in conversation. You must focus on these topics: {modules}.\n"
        )

        return prompt_template.format(
            toy_expanded_prompt=self.toy['expanded_prompt'],  # Assuming toy is also a dictionary
            child_name=self.user['child_name'],
            child_age=self.user['child_age'],
            child_name_repeat=self.user['child_name'],
            child_persona=self.user['child_persona'],
            child_age_repeat=self.user['child_age'],
            modules=modules
        )