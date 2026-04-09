import os
import json
from sentence_transformers import SentenceTransformer, util
import torch

class SemanticMatcher:
    def __init__(self, use_offline=True):
        # We assume models will be local by default for offline capability
        model_name = 'all-MiniLM-L6-v2'
        model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'local_models', model_name)
        
        # Fallback to downloading if not cached locally
        if use_offline and os.path.exists(model_path):
            self.model = SentenceTransformer(model_path)
        else:
            self.model = SentenceTransformer(model_name)
            
        self.ontology = self._load_ontology()
        self._build_embeddings()

    def _load_ontology(self):
        ontology_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data', 'ontology_base.json')
        try:
            with open(ontology_path, 'r') as f:
                data = json.load(f)
                return data['categories']
        except Exception as e:
            print(f"Failed to load ontology: {e}")
            return []

    def _build_embeddings(self):
        self.categories_data = []
        texts_to_embed = []
        
        for category in self.ontology:
            cat_name = category['name']
            aliases = category.get('aliases', [])
            all_terms = [cat_name] + aliases
            
            for term in all_terms:
                texts_to_embed.append(term)
                self.categories_data.append({
                    "term": term,
                    "category": cat_name,
                    "is_exclusion": category.get('default_exclusion', False)
                })
        
        # Compute embeddings for all terms in ontology
        self.ontology_embeddings = self.model.encode(texts_to_embed, convert_to_tensor=True)

    def match_item(self, item_description: str, threshold=0.5):
        """
        Given a line item from a hospital bill (e.g. 'Crocin Advance 500mg'),
        find the closest matching category in the ontology.
        """
        query_embedding = self.model.encode(item_description, convert_to_tensor=True)
        cos_scores = util.cos_sim(query_embedding, self.ontology_embeddings)[0]
        
        top_result = torch.topk(cos_scores, k=1)
        best_score = top_result.values.item()
        best_idx = top_result.indices.item()
        
        if best_score >= threshold:
            best_match = self.categories_data[best_idx]
            return {
                "category": best_match["category"],
                "matched_term": best_match["term"],
                "confidence": best_score,
                "is_exclusion": best_match["is_exclusion"]
            }
        else:
            # Fallback to Miscellaneous if similarity is too low
            return {
                "category": "Miscellaneous",
                "matched_term": None,
                "confidence": best_score,
                "is_exclusion": True
            }

# Simple test usage
if __name__ == "__main__":
    matcher = SemanticMatcher(use_offline=False) # For quick test
    print(matcher.match_item("MRI Scan of Head"))
    print(matcher.match_item("Antibiotic IV Injection"))
    print(matcher.match_item("Private AC Room"))
