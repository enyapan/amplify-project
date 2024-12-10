import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from 'aws-amplify/api';
import { withAuthenticator } from "@aws-amplify/ui-react";
import { listNotes } from "./graphql/queries";
import { createNote, updateNote, deleteNote } from "./graphql/mutations";
import awsExports from "./aws-exports";
import "./App.css";

Amplify.configure(awsExports);
const API = generateClient();


function App({ signOut, user }) {
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [noteIdToEdit, setNoteIdToEdit] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const result = await API.graphql({query: listNotes});
      setNotes(result.data.listNotes.items);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const result = await API.graphql(
        {query:createNote, variables:{ input: { content: noteContent } }}
      );
      setNotes([...notes, result.data.createNote]);
      setNoteContent("");
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleEditNote = async (note) => {
    setEditMode(true);
    setNoteIdToEdit(note.id);
    setNoteContent(note.content);
  };

  const handleUpdateNote = async () => {
    if (!noteContent.trim()) return;
    try {
      const result = await API.graphql(
        {query:updateNote, variables:{
          input: { id: noteIdToEdit, content: noteContent },
        }}
      );
      const updatedNotes = notes.map((note) =>
        note.id === noteIdToEdit ? result.data.updateNote : note
      );
      setNotes(updatedNotes);
      setEditMode(false);
      setNoteIdToEdit(null);
      setNoteContent("");
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await API.graphql({query:deleteNote, variables:{ input: { id } }});
      setNotes(notes.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Secure Notes App</h1>
        <button onClick={signOut}>Sign Out</button>
      </header>
      <main>
        <div className="note-form">
          <textarea
            placeholder="Enter your note here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          ></textarea>
          <button onClick={editMode ? handleUpdateNote : handleAddNote}>
            {editMode ? "Update Note" : "Add Note"}
          </button>
        </div>
        <div className="notes-list">
          {notes.map((note) => (
            <div key={note.id} className="note-item">
              <p>{note.content}</p>
              <div className="note-actions">
                <button onClick={() => handleEditNote(note)}>Edit</button>
                <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default withAuthenticator(App);