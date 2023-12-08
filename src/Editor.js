import React, { useState, useEffect, useRef } from 'react';
import { Schema, DOMParser, MarkSpec } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import './EditorStyles.css'; // Make sure to include your CSS file

const annotationMark = {
  attrs: { title: {}, id: {} },
  inclusive: false,
  parseDOM: [
    { tag: "span.annotation", getAttrs: dom => ({ title: dom.getAttribute("title"), id: dom.getAttribute("data-id") }) }
  ],
  toDOM: node => ["span", { class: "annotation", title: node.attrs.title, "data-id": node.attrs.id }, 0]
};

const mySchema = new Schema({
  nodes: basicSchema.spec.nodes,
  marks: {
    ...basicSchema.spec.marks,
    annotation: annotationMark
  }
});

const Editor = () => {
  const editorRef = useRef();
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);

  useEffect(() => {
    const startDoc = mySchema.nodeFromJSON({
      type: "doc",
      content: [{
        type: "paragraph",
        content: [{
          type: "text",
          text: "This setup gives you a starting point. A full implementation of word-level annotations in a ProseMirror-based React application requires a deep understanding of both ProseMirror's API and React's patterns. Due to the complexity and length of the full implementation, I recommend approaching it incrementally, testing each part as you build it."
        }]
      }]
    });

    const state = EditorState.create({
      doc: startDoc,
      schema: mySchema
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        let newState = view.state.apply(transaction);
        view.updateState(newState);
      }
    });

    view.dom.addEventListener('click', (event) => {
      const { pos } = view.posAtCoords({ left: event.clientX, top: event.clientY });
      const resolvedPos = view.state.doc.resolve(pos);
      const marks = resolvedPos.marks();

      const annotation = marks.find(mark => mark.type === mySchema.marks.annotation);
      if (annotation) {
        setSelectedAnnotationId(annotation.attrs.id);
      }
    });

    initAnnotations(view);

    return () => { 
      view.destroy(); 
    };
  }, []);

  const initAnnotations = (view) => {
    const initialAnnotations = [
      { word: "ProseMirror", annotation: "ProseMirror is a JS editor" },
      { word: "complexity", annotation: "complexity is high for this project" },
      { word: "incrementally", annotation: "yes, we should do this incrementally" }
    ];

    initialAnnotations.forEach(({ word, annotation }, index) => {
      addAnnotation(view.state, view.dispatch, word, annotation, index.toString());
    });

    setAnnotations(initialAnnotations.map((a, index) => ({ ...a, id: index.toString() })));
  };

  const addAnnotation = (state, dispatch, word, annotationText, id) => {
    let tr = state.tr;
    let regex = new RegExp(`\\b${word}\\b`, "g");
    
    state.doc.descendants((node, pos) => {
        if (!node.isText) return;

        let text = node.text;
        let matches;
        while ((matches = regex.exec(text)) !== null) {
            let from = pos + matches.index;
            let to = from + word.length;
            tr = tr.addMark(from, to, mySchema.marks.annotation.create({ title: annotationText, id }));
        }
    });

    if (tr.docChanged) {
        dispatch(tr);
    }
  };

  const handleCommentClick = (id) => {
    setSelectedAnnotationId(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div ref={editorRef} style={{ flex: 1 }}></div>
      <div style={{ flex: 1, marginLeft: '20px' }}>
        {annotations.map(annotation => (
          <div key={annotation.id} 
               className={selectedAnnotationId === annotation.id ? "annotation-comment selected" : "annotation-comment"}
               onClick={() => handleCommentClick(annotation.id)}>
            {annotation.annotation}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Editor;
