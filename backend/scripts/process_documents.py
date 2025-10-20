"""
Process documents and add to vector database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.rag.document_processor import document_processor
from app.services.vector.chroma_service import chroma_service


def process_all_documents():
    """Process all documents in data/documents directory"""
    documents_dir = Path("data/documents")
    
    if not documents_dir.exists():
        print(f"Error: Directory '{documents_dir}' does not exist")
        return
    
    print("=== Processing Documents ===")
    print(f"Directory: {documents_dir.absolute()}")
    
    # Get all files
    files = list(documents_dir.glob("*"))
    if not files:
        print("No files found in directory")
        return
    
    print(f"Found {len(files)} files\n")
    
    # Process directory
    results = document_processor.process_directory(str(documents_dir))
    
    if not results:
        print("\nNo documents were processed successfully")
        return
    
    # Add to vector database
    print("\n=== Adding to Vector Database ===")
    total_chunks = 0
    
    for result in results:
        try:
            chroma_service.add_documents(
                documents=result["chunks"],
                metadatas=result["metadatas"]
            )
            total_chunks += len(result["chunks"])
            print(f"Added {len(result['chunks'])} chunks from {result['source']}")
        except Exception as e:
            print(f"Error adding {result['source']}: {str(e)}")
    
    print(f"\n=== Summary ===")
    print(f"Documents processed: {len(results)}")
    print(f"Total chunks added: {total_chunks}")
    print(f"Vector database size: {chroma_service.count()}")


if __name__ == "__main__":
    process_all_documents()

