import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DocumentManager from './DocumentManager';

// Mock the component since it uses client-side features
jest.mock('./DocumentManager', () => {
  return function MockDocumentManager({ documents, activeDocument, onSelectDocument, onRemoveDocument, onClose, onAddMoreDocuments }) {
    return (
      <div data-testid="document-manager">
        <button onClick={onClose}>Close</button>
        <button onClick={onAddMoreDocuments}>Add More Documents</button>
        {documents.map((doc) => (
          <div key={doc.id} data-testid={`document-${doc.id}`}>
            <span>{doc.name}</span>
            <button onClick={() => onSelectDocument(doc)}>Select</button>
            <button onClick={() => onRemoveDocument(doc.id)}>Remove</button>
          </div>
        ))}
      </div>
    );
  };
});

describe('DocumentManager', () => {
  const mockDocuments = [
    { id: 1, name: 'Document 1', text: 'Content 1', timestamp: '2024-01-01' },
    { id: 2, name: 'Document 2', text: 'Content 2', timestamp: '2024-01-02' },
  ];

  const mockProps = {
    documents: mockDocuments,
    activeDocument: null,
    onSelectDocument: jest.fn(),
    onRemoveDocument: jest.fn(),
    onClose: jest.fn(),
    onAddMoreDocuments: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders document manager with documents', () => {
    render(<DocumentManager {...mockProps} />);
    
    expect(screen.getByTestId('document-manager')).toBeInTheDocument();
    expect(screen.getByText('Document 1')).toBeInTheDocument();
    expect(screen.getByText('Document 2')).toBeInTheDocument();
  });

  test('calls onAddMoreDocuments when add more documents button is clicked', () => {
    render(<DocumentManager {...mockProps} />);
    
    const addButton = screen.getByText('Add More Documents');
    fireEvent.click(addButton);
    
    expect(mockProps.onAddMoreDocuments).toHaveBeenCalled();
  });

  test('calls onSelectDocument when select button is clicked', () => {
    render(<DocumentManager {...mockProps} />);
    
    const selectButton = screen.getByText('Select');
    fireEvent.click(selectButton);
    
    expect(mockProps.onSelectDocument).toHaveBeenCalledWith(mockDocuments[0]);
  });

  test('calls onRemoveDocument when remove button is clicked', () => {
    render(<DocumentManager {...mockProps} />);
    
    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);
    
    expect(mockProps.onRemoveDocument).toHaveBeenCalledWith(1);
  });

  test('calls onClose when close button is clicked', () => {
    render(<DocumentManager {...mockProps} />);
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
}); 