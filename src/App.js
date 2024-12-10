// src/App.js
import React, { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import awsExports from "./aws-exports";
import { Authenticator, useTheme, useAuthenticator, View, Heading, Text, Image, Button as AmplifyButton } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import "@fontsource/poppins";
import { Box, Paper, Typography, TextField, IconButton, Button, Chip } from "@mui/material";
import { FaEdit, FaTrashAlt, FaPlus, FaSave, FaTimes } from "react-icons/fa";
import PushPinIcon from '@mui/icons-material/PushPin';
import { generateClient } from "aws-amplify/api";
import { listNotes } from "./graphql/queries";
import { createNote, updateNote, deleteNote } from "./graphql/mutations";

Amplify.configure(awsExports);
const API = generateClient();

const components = {
  Header() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Image
          alt="Amplify logo"
          src="https://docs.amplify.aws/assets/logo-dark.svg"
        />
      </View>
    );
  },
  Footer() {
    const { tokens } = useTheme();
    return (
      <View textAlign="center" padding={tokens.space.large}>
        <Text color={tokens.colors.neutral[80]}>&copy; All Rights Reserved</Text>
      </View>
    );
  },
  SignIn: {
    Header() {
      return (
        <Heading padding="1rem 0 0 1rem" level={3}>
          Sign in to your account
        </Heading>
      );
    },
    Footer() {
      const { toForgotPassword } = useAuthenticator();
      return (
        <View textAlign="center" padding="0 0 1rem 0">
          <AmplifyButton fontWeight="normal" onClick={toForgotPassword} size="small" variation="link">
            Reset Password
          </AmplifyButton>
        </View>
      );
    },
  },
  SignUp: {
    Header() {
      return (
        <Heading padding="1rem 0 0 1rem" level={3}>
          Create a new account
        </Heading>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View textAlign="center" padding="0 0 1rem 0">
          <AmplifyButton fontWeight="normal" onClick={toSignIn} size="small" variation="link">
            Back to Sign In
          </AmplifyButton>
        </View>
      );
    },
  },
  ConfirmSignUp: {
    Header() {
      return (
        <Heading padding="1rem 0 0 1rem" level={3}>
          Confirm your account
        </Heading>
      );
    },
    Footer() {
      const { toSignIn } = useAuthenticator();
      return (
        <View textAlign="center" padding="0 0 1rem 0">
          <AmplifyButton fontWeight="normal" onClick={toSignIn} size="small" variation="link">
            Back to Sign In
          </AmplifyButton>
        </View>
      );
    },
  },
};

const formFields = {
  signIn: {
    username: {
      placeholder: 'Enter your email',
    },
  },
  signUp: {
    password: {
      label: 'Password',
      placeholder: 'Enter your password',
      isRequired: false,
      order: 2,
    },
    confirm_password: {
      label: 'Confirm Password',
      placeholder: 'Re-enter your password',
      order: 1,
    },
  },
};

function NotesHeader({ signOut }) {
  return (
    <Box
      sx={{
        backgroundColor: "#2563eb",
        color: "#fff",
        padding: "1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
        Secure Notes App
      </Typography>
      <AmplifyButton
        onClick={signOut}
        variation="primary"
        style={{ backgroundColor: "#ef4444" }}
      >
        Sign Out
      </AmplifyButton>
    </Box>
  );
}

function NotesAddForm({ noteHeader, setNoteHeader, noteContent, setNoteContent, noteTags, setNoteTags, handleAddNote, editMode, handleUpdateNote }) {
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
      <TextField
        label="Title"
        placeholder="Optional Title for the note"
        value={noteHeader}
        onChange={(e) => setNoteHeader(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        multiline
        rows={4}
        placeholder="Enter your note here..."
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <TextField
        label="Tags (comma separated)"
        placeholder="e.g. work,personal,urgent"
        value={noteTags}
        onChange={(e) => setNoteTags(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />
      <Button
        onClick={editMode ? handleUpdateNote : handleAddNote}
        variant="contained"
        startIcon={<FaPlus />}
        sx={{ backgroundColor: "#2563eb", color: "#fff", ":hover": { backgroundColor: "#1e40af" } }}
      >
        {editMode ? "Update Note" : "Add Note"}
      </Button>
    </Paper>
  );
}

function NotesGrid({
  notes,
  editingNoteId,
  editingHeader,
  setEditingHeader,
  editingContent,
  setEditingContent,
  editingTags,
  setEditingTags,
  handleEditNoteInit,
  handleEditNoteSave,
  handleEditNoteCancel,
  handleDeleteNote,
  pinnedNotes,
  handleTogglePin,
}) {
  const colors = ["#FFFACD", "#FFEB99", "#FFEEAD", "#E0BBE4", "#FFB3BA", "#BFFCC6", "#FFDFBA"];

  // Sort notes so pinned appear first
  const pinned = notes.filter((n) => pinnedNotes[n.id]);
  const unpinned = notes.filter((n) => !pinnedNotes[n.id]);
  const sortedNotes = [...pinned, ...unpinned];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)", // Always 5 columns
        gap: 2,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {sortedNotes.map((note, index) => {
        const isEditing = editingNoteId === note.id;
        const bgColor = colors[index % colors.length];

        // If no header is provided, fallback to empty string (or you could show first line of content)
        const displayHeader = note.header || "";

        // Tag display
        const tags = note.tags || [];

        return (
          <Paper
            key={note.id}
            elevation={4}
            sx={{
              p: 2,
              position: "relative",
              backgroundColor: bgColor,
              transform: "rotate(-2deg)",
              display: "flex",
              flexDirection: "column",
              minHeight: "200px",
            }}
          >
            {/* Header */}
            {isEditing ? (
              <TextField
                label="Header"
                value={editingHeader}
                onChange={(e) => setEditingHeader(e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
              />
            ) : (
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                {displayHeader}
              </Typography>
            )}

            {isEditing ? (
              <TextField
                multiline
                rows={3}
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                fullWidth
                sx={{ flexGrow: 1, mb: 1 }}
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  flexGrow: 1,
                  display: "-webkit-box",
                  WebkitLineClamp: 5,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "normal"
                }}
              >
                {note.content}
              </Typography>
            )}

            {isEditing ? (
              <TextField
                label="Tags (comma separated)"
                value={editingTags}
                onChange={(e) => setEditingTags(e.target.value)}
                fullWidth
                sx={{ mb: 1 }}
              />
            ) : (
              <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {tags.map((tag, i) => (
                  <Chip key={i} label={tag} size="small" />
                ))}
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1, gap: 1 }}>
              {isEditing ? (
                <>
                  <IconButton
                    color="success"
                    onClick={() => handleEditNoteSave(note.id)}
                    title="Save"
                  >
                    <FaSave />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={handleEditNoteCancel}
                    title="Cancel"
                  >
                    <FaTimes />
                  </IconButton>
                </>
              ) : (
                <>
                  {/* Pin Button */}
                  <IconButton
                    onClick={() => handleTogglePin(note.id)}
                    title={pinnedNotes[note.id] ? "Unpin Note" : "Pin Note"}
                    sx={{ color: pinnedNotes[note.id] ? "#dc2626" : "#1e3a8a" }}
                  >
                    <PushPinIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleEditNoteInit(note)}
                    title="Edit Note"
                    sx={{ color: "#1e3a8a" }}
                  >
                    <FaEdit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteNote(note.id)}
                    title="Delete Note"
                    sx={{ color: "#dc2626" }}
                  >
                    <FaTrashAlt />
                  </IconButton>
                </>
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}

function SecureNotesApp({ signOut }) {
  const [notes, setNotes] = useState([]);
  
  const [noteHeader, setNoteHeader] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteTags, setNoteTags] = useState("");

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingHeader, setEditingHeader] = useState("");
  const [editingContent, setEditingContent] = useState("");
  const [editingTags, setEditingTags] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [noteIdToEdit, setNoteIdToEdit] = useState(null);

  // Track pinned notes locally (not persisted)
  const [pinnedNotes, setPinnedNotes] = useState({}); 

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line
  }, []);

  const fetchNotes = async () => {
    try {
      const result = await API.graphql({ query: listNotes });
      setNotes(result.data.listNotes.items);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  const parseTags = (tagString) => {
    return tagString
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    const input = {
      header: noteHeader.trim() || null,
      content: noteContent.trim(),
      tags: parseTags(noteTags)
    };

    try {
      const result = await API.graphql({
        query: createNote,
        variables: { input },
      });
      setNotes([...notes, result.data.createNote]);
      setNoteHeader("");
      setNoteContent("");
      setNoteTags("");
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleEditNoteInit = (note) => {
    setEditingNoteId(note.id);
    setEditingHeader(note.header || "");
    setEditingContent(note.content);
    setEditingTags(note.tags ? note.tags.join(", ") : "");
    setEditMode(true);
    setNoteIdToEdit(note.id);
    setNoteHeader(note.header || "");
    setNoteContent(note.content);
    setNoteTags(note.tags ? note.tags.join(", ") : "");
  };

  const handleEditNoteSave = async (id) => {
    if (!editingContent.trim()) return;
    const input = {
      id: id,
      header: editingHeader.trim() || null,
      content: editingContent.trim(),
      tags: parseTags(editingTags)
    };

    try {
      const result = await API.graphql({
        query: updateNote,
        variables: { input },
      });
      const updatedNotes = notes.map((n) =>
        n.id === id ? result.data.updateNote : n
      );
      setNotes(updatedNotes);
      setEditingNoteId(null);
      setEditingHeader("");
      setEditingContent("");
      setEditingTags("");
      setEditMode(false);
      setNoteIdToEdit(null);
      setNoteHeader("");
      setNoteContent("");
      setNoteTags("");
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleEditNoteCancel = () => {
    setEditingNoteId(null);
    setEditingHeader("");
    setEditingContent("");
    setEditingTags("");
    setEditMode(false);
    setNoteIdToEdit(null);
    setNoteHeader("");
    setNoteContent("");
    setNoteTags("");
  };

  const handleUpdateNote = async () => {
    if (!noteContent.trim() || !noteIdToEdit) return;
    const input = {
      id: noteIdToEdit,
      header: noteHeader.trim() || null,
      content: noteContent.trim(),
      tags: parseTags(noteTags)
    };

    try {
      const result = await API.graphql({
        query: updateNote,
        variables: { input },
      });
      const updatedNotes = notes.map((n) =>
        n.id === noteIdToEdit ? result.data.updateNote : n
      );
      setNotes(updatedNotes);
      setEditMode(false);
      setNoteIdToEdit(null);
      setNoteHeader("");
      setNoteContent("");
      setNoteTags("");
      setEditingNoteId(null);
      setEditingHeader("");
      setEditingContent("");
      setEditingTags("");
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;

    try {
      await API.graphql({ query: deleteNote, variables: { input: { id } } });
      setNotes(notes.filter((note) => note.id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleTogglePin = (id) => {
    setPinnedNotes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <Box sx={{ width: "100vw", minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", flexDirection: "column" }}>
      <NotesHeader signOut={signOut} />
      <Box sx={{ flex: "1 1 auto", p: 2, display: "flex", flexDirection: "column" }}>
        <NotesAddForm 
          noteHeader={noteHeader}
          setNoteHeader={setNoteHeader}
          noteContent={noteContent}
          setNoteContent={setNoteContent}
          noteTags={noteTags}
          setNoteTags={setNoteTags}
          handleAddNote={handleAddNote}
          editMode={editMode}
          handleUpdateNote={handleUpdateNote}
        />
        <NotesGrid
          notes={notes}
          editingNoteId={editingNoteId}
          editingHeader={editingHeader}
          setEditingHeader={setEditingHeader}
          editingContent={editingContent}
          setEditingContent={setEditingContent}
          editingTags={editingTags}
          setEditingTags={setEditingTags}
          handleEditNoteInit={handleEditNoteInit}
          handleEditNoteSave={handleEditNoteSave}
          handleEditNoteCancel={handleEditNoteCancel}
          handleDeleteNote={handleDeleteNote}
          pinnedNotes={pinnedNotes}
          handleTogglePin={handleTogglePin}
        />
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <Authenticator formFields={formFields} components={components}>
      {({ signOut }) => <SecureNotesApp signOut={signOut} />}
    </Authenticator>
  );
}
