Confirmation / form dialog over a navy scrim. Closes on backdrop click or Esc.

```jsx
<Modal open={open} title="Confirmer le contact" onClose={close}
  footer={<>
    <Button variant="ghost" onClick={close}>Annuler</Button>
    <Button onClick={send}>Envoyer la demande</Button>
  </>}>
  <p>Votre message sera transmis à l'établissement. Continuer ?</p>
</Modal>
```

Render conditionally or drive with `open`. Keep the primary action red, secondary ghost.
