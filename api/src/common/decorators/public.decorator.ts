import { SetMetadata } from '@nestjs/common';

export const CLE_PUBLIC = 'ecoles360:public';

/**
 * Ouvre une route à l'anonyme — livrable 11 §2.
 *
 * Le `SessionGuard` est enregistré GLOBALEMENT : tout est fermé par défaut, et
 * seules les routes marquées ici sont ouvertes. Ce sens est délibéré — oublier
 * ce décorateur rend une route publique inaccessible, ce qui se voit tout de
 * suite ; l'oubli inverse exposerait des données sans que rien ne le signale.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(CLE_PUBLIC, true);
